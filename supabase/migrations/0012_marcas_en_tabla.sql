-- Marcas en tabla propia, con permisos por marca. Primer dominio que sale del documento de la agencia.
-- Solo añade: la app sigue leyendo agency_workspaces hasta que su código cambie.

create table public.brands (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  id text not null check (length(id) between 1 and 120),
  name text not null check (length(name) between 1 and 200),
  slug text not null default '',
  archived boolean not null default false,
  -- El resto de los campos, hasta que cada uno merezca su columna.
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (agency_id, id)
);

-- Sin filas para una persona, ve todas las marcas de su agencia: así funciona hoy.
-- Con alguna fila, solo ve las asignadas. Dueños y administradores siempre ven todo.
create table public.brand_members (
  agency_id uuid not null,
  brand_id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  primary key (agency_id, brand_id, user_id),
  foreign key (agency_id, brand_id) references public.brands (agency_id, id) on delete cascade,
  foreign key (agency_id, user_id) references public.agency_members (agency_id, user_id) on delete cascade
);
create index brand_members_user on public.brand_members (agency_id, user_id);

create function public.brand_assigned(target_agency uuid, target_brand text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (
      select 1 from public.brand_members m
      where m.agency_id = target_agency and m.user_id = auth.uid()
    ) or exists (
      select 1 from public.brand_members m
      where m.agency_id = target_agency and m.user_id = auth.uid() and m.brand_id = target_brand
    )
$$;

create function public.can_see_brand(target_agency uuid, target_brand text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case public.member_role(target_agency)
    when 'owner' then true
    when 'admin' then true
    when 'editor' then public.brand_assigned(target_agency, target_brand)
    when 'viewer' then public.brand_assigned(target_agency, target_brand)
    else false
  end
$$;

revoke execute on function public.can_see_brand(uuid, text), public.brand_assigned(uuid, text) from public, anon;
grant execute on function public.can_see_brand(uuid, text), public.brand_assigned(uuid, text) to authenticated;

alter table public.brands enable row level security;
alter table public.brand_members enable row level security;

revoke all on public.brands, public.brand_members from anon, authenticated;
grant select, insert, update, delete on public.brands to authenticated;
grant select, insert, delete on public.brand_members to authenticated;

create policy brands_select on public.brands for select to authenticated
  using (public.can_see_brand(agency_id, id));
create policy brands_insert on public.brands for insert to authenticated
  with check (public.member_role(agency_id) in ('owner', 'admin', 'editor'));
create policy brands_update on public.brands for update to authenticated
  using (public.member_role(agency_id) in ('owner', 'admin', 'editor') and public.can_see_brand(agency_id, id))
  with check (public.member_role(agency_id) in ('owner', 'admin', 'editor'));
create policy brands_delete on public.brands for delete to authenticated
  using (public.member_role(agency_id) in ('owner', 'admin'));

create policy brand_members_select on public.brand_members for select to authenticated
  using (user_id = auth.uid() or public.member_role(agency_id) in ('owner', 'admin'));
create policy brand_members_insert on public.brand_members for insert to authenticated
  with check (public.member_role(agency_id) in ('owner', 'admin'));
create policy brand_members_delete on public.brand_members for delete to authenticated
  using (public.member_role(agency_id) in ('owner', 'admin'));

-- Copia desde el documento. Se puede repetir: lo ya copiado no se toca, y el documento tampoco.
create function public.copy_brands_from_workspace(target_agency uuid)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  total integer;
begin
  insert into public.brands (agency_id, id, name, slug, archived, data)
  select target_agency, b->>'id', coalesce(nullif(b->>'name', ''), 'Sin nombre'), coalesce(b->>'slug', ''),
         coalesce(b->>'status', '') = 'archived' or coalesce((b->>'archived')::boolean, false),
         b - 'id' - 'name' - 'slug'
  from public.agency_workspaces w
  cross join lateral jsonb_array_elements(case when jsonb_typeof(w.data->'brands') = 'array' then w.data->'brands' else '[]'::jsonb end) b
  where w.agency_id = target_agency and jsonb_typeof(b) = 'object' and coalesce(b->>'id', '') <> ''
  on conflict (agency_id, id) do nothing;
  get diagnostics total = row_count;
  return total;
end;
$$;
revoke execute on function public.copy_brands_from_workspace(uuid) from public, anon, authenticated;
