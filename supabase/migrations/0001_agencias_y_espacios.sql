-- Agencias, miembros, espacio de trabajo y enlaces públicos de revisión.
-- El contenido de cada agencia vive por ahora en un documento JSON con control de versión.
-- Las tablas no admiten escritura directa: toda modificación pasa por las funciones de abajo.

create table public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.agency_members (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);
create index agency_members_user_idx on public.agency_members (user_id);

create table public.agency_workspaces (
  agency_id uuid primary key references public.agencies (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

create table public.share_links (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  brand_id text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index share_links_agency_idx on public.share_links (agency_id);

create table public.agency_invitations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'editor', 'viewer')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index agency_invitations_agency_idx on public.agency_invitations (agency_id);

alter table public.agencies enable row level security;
alter table public.agency_members enable row level security;
alter table public.agency_workspaces enable row level security;
alter table public.share_links enable row level security;
alter table public.agency_invitations enable row level security;

-- ---------------------------------------------------------------- utilidades

create function public.member_role(target_agency uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select m.role from public.agency_members m
  where m.agency_id = target_agency and m.user_id = auth.uid()
$$;

create function public.hash_token(raw text)
returns text
language sql immutable set search_path = ''
as $$
  select encode(pg_catalog.sha256(convert_to(raw, 'UTF8')), 'hex')
$$;

create function public.new_token()
returns text
language sql volatile set search_path = ''
as $$
  select replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '')
$$;

-- ---------------------------------------------------------------- lectura

create policy agencies_select on public.agencies
  for select to authenticated
  using (public.member_role(id) is not null);

create policy members_select on public.agency_members
  for select to authenticated
  using (public.member_role(agency_id) is not null);

create policy workspaces_select on public.agency_workspaces
  for select to authenticated
  using (public.member_role(agency_id) is not null);

create policy share_links_select on public.share_links
  for select to authenticated
  using (public.member_role(agency_id) in ('owner', 'admin', 'editor'));

create policy invitations_select on public.agency_invitations
  for select to authenticated
  using (public.member_role(agency_id) in ('owner', 'admin'));

-- ---------------------------------------------------------------- agencias

create function public.create_agency(agency_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  insert into public.agencies (name, created_by) values (trim(agency_name), uid) returning id into new_id;
  insert into public.agency_members (agency_id, user_id, role) values (new_id, uid, 'owner');
  insert into public.agency_workspaces (agency_id, updated_by) values (new_id, uid);
  return new_id;
end;
$$;

-- Devuelve la nueva versión, o lanza stale_version si alguien guardó antes.
create function public.save_workspace(target_agency uuid, new_data jsonb, expected_version integer)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  next_version integer;
begin
  if coalesce(public.member_role(target_agency), 'viewer') not in ('owner', 'admin', 'editor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.agency_workspaces
    set data = new_data, version = version + 1, updated_at = now(), updated_by = auth.uid()
    where agency_id = target_agency and version = expected_version
    returning version into next_version;
  if next_version is null then
    raise exception 'stale_version' using errcode = '40001';
  end if;
  return next_version;
end;
$$;

create function public.remove_member(target_agency uuid, target_user uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if public.member_role(target_agency) is distinct from 'owner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if (select m.role from public.agency_members m where m.agency_id = target_agency and m.user_id = target_user) = 'owner'
     and (select count(*) from public.agency_members m where m.agency_id = target_agency and m.role = 'owner') = 1 then
    raise exception 'last_owner' using errcode = '23514';
  end if;
  delete from public.agency_members m where m.agency_id = target_agency and m.user_id = target_user;
end;
$$;

-- ---------------------------------------------------------------- invitaciones

create function public.create_invitation(target_agency uuid, invite_email text, invite_role text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  raw text := public.new_token();
begin
  if coalesce(public.member_role(target_agency), '') not in ('owner', 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.agency_invitations (agency_id, email, role, token_hash, expires_at, created_by)
  values (target_agency, lower(trim(invite_email)), invite_role, public.hash_token(raw), now() + interval '7 days', auth.uid());
  return raw;
end;
$$;

-- Solo la acepta quien tenga ese correo ya verificado.
create function public.accept_invitation(raw_token text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  inv public.agency_invitations;
  user_email text;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select i.* into inv from public.agency_invitations i
    where i.token_hash = public.hash_token(raw_token)
      and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
    for update;
  if inv.id is null then
    raise exception 'invalid_invitation' using errcode = '22023';
  end if;
  select lower(u.email) into user_email from auth.users u
    where u.id = uid and u.email_confirmed_at is not null;
  if user_email is distinct from inv.email then
    raise exception 'email_mismatch' using errcode = '42501';
  end if;
  insert into public.agency_members (agency_id, user_id, role)
    values (inv.agency_id, uid, inv.role)
    on conflict (agency_id, user_id) do nothing;
  update public.agency_invitations set accepted_at = now() where id = inv.id;
  return inv.agency_id;
end;
$$;

-- ---------------------------------------------------------------- portal de revisión

create function public.create_share_link(target_agency uuid, target_brand text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  raw text := public.new_token();
begin
  if coalesce(public.member_role(target_agency), '') not in ('owner', 'admin', 'editor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  insert into public.share_links (agency_id, brand_id, token_hash, expires_at, created_by)
  values (target_agency, target_brand, public.hash_token(raw), now() + interval '30 days', auth.uid());
  return raw;
end;
$$;

create function public.revoke_share_link(link_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.share_links l set revoked_at = now()
    where l.id = link_id
      and coalesce(public.member_role(l.agency_id), '') in ('owner', 'admin', 'editor');
end;
$$;

-- Solo entrega la marca del enlace y los campos públicos de sus posts,
-- nunca notas, tareas, documentos, chat, actividad ni datos de otras marcas.
create function public.get_share_portal(raw_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  link public.share_links;
  doc jsonb;
begin
  select l.* into link from public.share_links l
    where l.token_hash = public.hash_token(raw_token)
      and l.revoked_at is null and l.expires_at > now();
  if link.id is null then
    return null;
  end if;
  select w.data into doc from public.agency_workspaces w where w.agency_id = link.agency_id;
  return jsonb_build_object(
    'brand', (
      select jsonb_build_object(
        'id', b->'id', 'name', b->'name', 'handle', b->'handle',
        'initials', b->'initials', 'color', b->'color'
      )
      from jsonb_array_elements(coalesce(doc->'brands', '[]'::jsonb)) b
      where b->>'id' = link.brand_id
      limit 1
    ),
    'posts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p->'id', 'brandId', p->'brandId', 'title', p->'title', 'caption', p->'caption',
        'network', p->'network', 'networks', p->'networks', 'format', p->'format',
        'cover', p->'cover', 'mediaUrl', p->'mediaUrl', 'scheduledDate', p->'scheduledDate',
        'scheduledTime', p->'scheduledTime', 'status', p->'status', 'comments', p->'comments'
      ))
      from jsonb_array_elements(coalesce(doc->'posts', '[]'::jsonb)) p
      where p->>'brandId' = link.brand_id
        and p->>'status' in ('pending', 'changes', 'approved', 'scheduled', 'published')
    ), '[]'::jsonb)
  );
end;
$$;

-- El nombre lo escribe quien visita: se guarda como firma, no como identidad verificada.
create function public.submit_share_decision(
  raw_token text, target_post text, decision text, comment_text text, signer text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  link public.share_links;
  doc jsonb;
  updated jsonb;
  found boolean := false;
  label text;
begin
  if decision not in ('approved', 'changes') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  if decision = 'changes' and coalesce(trim(comment_text), '') = '' then
    raise exception 'comment_required' using errcode = '22023';
  end if;
  label := case decision when 'approved' then 'Programado' else 'Requiere cambios' end;
  select l.* into link from public.share_links l
    where l.token_hash = public.hash_token(raw_token)
      and l.revoked_at is null and l.expires_at > now();
  if link.id is null then
    return false;
  end if;
  select w.data into doc from public.agency_workspaces w where w.agency_id = link.agency_id for update;
  select jsonb_agg(
    case when p->>'id' = target_post and p->>'brandId' = link.brand_id
              and p->>'status' in ('pending', 'changes', 'approved')
      then p || jsonb_build_object(
        'status', decision,
        'statusLabel', label,
        'comments', coalesce(p->'comments', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'id', 'c-' || gen_random_uuid()::text,
          'author', left(coalesce(nullif(trim(signer), ''), 'Cliente'), 80),
          'role', 'client',
          'text', left(coalesce(nullif(trim(comment_text), ''), 'Aprobado desde el enlace de revisión.'), 2000),
          'createdAt', to_char(now(), 'YYYY-MM-DD HH24:MI')
        ))
      )
      else p
    end
    order by ord
  )
  into updated
  from jsonb_array_elements(coalesce(doc->'posts', '[]'::jsonb)) with ordinality as t(p, ord);
  select exists (
    select 1 from jsonb_array_elements(coalesce(doc->'posts', '[]'::jsonb)) p
    where p->>'id' = target_post and p->>'brandId' = link.brand_id
      and p->>'status' in ('pending', 'changes', 'approved')
  ) into found;
  if not found then
    return false;
  end if;
  update public.agency_workspaces
    set data = jsonb_set(doc, '{posts}', updated), version = version + 1, updated_at = now()
    where agency_id = link.agency_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------- permisos

revoke all on all tables in schema public from anon, authenticated;
grant select on public.agencies, public.agency_members, public.agency_workspaces,
  public.share_links, public.agency_invitations to authenticated;

revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.member_role(uuid) to authenticated;
grant execute on function public.create_agency(text) to authenticated;
grant execute on function public.save_workspace(uuid, jsonb, integer) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.create_invitation(uuid, text, text) to authenticated;
grant execute on function public.accept_invitation(text) to authenticated;
grant execute on function public.create_share_link(uuid, text) to authenticated;
grant execute on function public.revoke_share_link(uuid) to authenticated;
grant execute on function public.get_share_portal(text) to anon, authenticated;
grant execute on function public.submit_share_decision(text, text, text, text, text) to anon, authenticated;
