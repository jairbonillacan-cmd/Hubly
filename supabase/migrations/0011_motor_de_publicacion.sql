-- Motor de publicación: cuentas conectadas y cola. Ver docs/publicacion/ESPECIFICACION.md.
-- Los tokens no están aquí ni los lee el navegador: viven cifrados en social_account_secrets.

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  brand_id text not null,
  network text not null check (network in ('instagram', 'facebook')),
  external_id text not null,
  display_name text not null default '',
  needs_reconnect boolean not null default false,
  token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (agency_id, network, external_id)
);

create table public.social_account_secrets (
  account_id uuid primary key references public.social_accounts (id) on delete cascade,
  encrypted_token text not null,
  updated_at timestamptz not null default now()
);

create table public.publish_jobs (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  account_id uuid not null references public.social_accounts (id) on delete cascade,
  post_id text not null,
  status text not null default 'queued' check (status in ('queued', 'publishing', 'published', 'retry', 'failed', 'unconfirmed')),
  run_at timestamptz not null,
  attempts integer not null default 0,
  locked_at timestamptz,
  external_id text,
  external_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un solo trabajo por post y cuenta: la primera defensa contra publicar dos veces.
  unique (post_id, account_id)
);
create index publish_jobs_due on public.publish_jobs (run_at) where status in ('queued', 'retry');

alter table public.social_accounts enable row level security;
alter table public.social_account_secrets enable row level security;
alter table public.publish_jobs enable row level security;

revoke all on public.social_account_secrets from anon, authenticated;
revoke all on public.social_accounts, public.publish_jobs from anon, authenticated;
grant select on public.social_accounts, public.publish_jobs to authenticated;

create policy social_accounts_select on public.social_accounts
  for select to authenticated using (public.member_role(agency_id) is not null);
create policy publish_jobs_select on public.publish_jobs
  for select to authenticated using (public.member_role(agency_id) is not null);

-- Reserva atómica para el worker, que entra con la clave de servicio. Nadie más la ejecuta.
create function public.claim_publish_jobs(batch integer default 5)
returns setof public.publish_jobs
language sql security definer set search_path = ''
as $$
  update public.publish_jobs j
     set status = 'publishing', locked_at = now(), attempts = j.attempts + 1, updated_at = now()
   where j.id in (
     select c.id from public.publish_jobs c
       join public.social_accounts a on a.id = c.account_id
      where c.status in ('queued', 'retry') and c.run_at <= now() and not a.needs_reconnect
      order by c.run_at
      for update of c skip locked
      limit batch
   )
  returning j.*;
$$;
revoke execute on function public.claim_publish_jobs(integer) from public, anon, authenticated;

-- Un worker que murió pudo publicar: el trabajo atascado no se repite, se revisa.
create function public.expire_stuck_publish_jobs(older_than interval default interval '15 minutes')
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  total integer;
begin
  update public.publish_jobs
     set status = 'unconfirmed', error = 'Se interrumpió al publicar. Revisa la red antes de repetir.', updated_at = now()
   where status = 'publishing' and locked_at < now() - older_than;
  get diagnostics total = row_count;
  return total;
end;
$$;
revoke execute on function public.expire_stuck_publish_jobs(interval) from public, anon, authenticated;
