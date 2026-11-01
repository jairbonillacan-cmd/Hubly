-- Posts y tareas en tablas propias, con los permisos por marca. Se escriben solo al guardar, en la misma transacción.
-- La migración copia lo existente: al leer de las tablas no puede faltar nada.

create function public.can_see_doc_row(target_agency uuid, target_brand text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select case
    when target_brand is null then public.member_role(target_agency) is not null
    else public.can_see_brand(target_agency, target_brand)
  end
$$;
revoke execute on function public.can_see_doc_row(uuid, text) from public, anon;
grant execute on function public.can_see_doc_row(uuid, text) to authenticated;

-- Lo oculto a quien guarda se conserva tal cual: su guardado no lo recibió y no puede borrarlo.
create function public.keep_hidden_rows(target_agency uuid, current_items jsonb, new_items jsonb)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  with hidden as (
    select x from jsonb_array_elements(case when jsonb_typeof(current_items) = 'array' then current_items else '[]'::jsonb end) x
     where jsonb_typeof(x) = 'object' and not public.can_see_doc_row(target_agency, nullif(x->>'brandId', ''))
  )
  select coalesce((
      select jsonb_agg(t.x order by t.ord) from jsonb_array_elements(new_items) with ordinality as t(x, ord)
       where not exists (select 1 from hidden h where h.x->>'id' = t.x->>'id')
    ), '[]'::jsonb) || coalesce((select jsonb_agg(h.x) from hidden h), '[]'::jsonb)
$$;
revoke execute on function public.keep_hidden_rows(uuid, jsonb, jsonb) from public, anon, authenticated;

create table public.posts (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  id text not null check (length(id) between 1 and 120),
  brand_id text,
  position integer not null default 0,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (agency_id, id)
);
create index posts_brand on public.posts (agency_id, brand_id);
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;
grant select on public.posts to authenticated;
-- Se escribe solo a través de save_workspace.
create policy posts_select on public.posts for select to authenticated
  using (public.can_see_doc_row(agency_id, brand_id));

create table public.tasks (
  agency_id uuid not null references public.agencies (id) on delete cascade,
  id text not null check (length(id) between 1 and 120),
  brand_id text,
  position integer not null default 0,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (agency_id, id)
);
create index tasks_brand on public.tasks (agency_id, brand_id);
alter table public.tasks enable row level security;
revoke all on public.tasks from anon, authenticated;
grant select on public.tasks to authenticated;
-- Se escribe solo a través de save_workspace.
create policy tasks_select on public.tasks for select to authenticated
  using (public.can_see_doc_row(agency_id, brand_id));

create function public.sync_doc_rows_posts(target_agency uuid, items jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.posts (agency_id, id, brand_id, position, data, updated_at)
  select target_agency, t.x->>'id', nullif(t.x->>'brandId', ''), t.ord, t.x, now()
    from jsonb_array_elements(items) with ordinality as t(x, ord)
   where jsonb_typeof(t.x) = 'object' and coalesce(t.x->>'id', '') <> ''
  on conflict (agency_id, id) do update
    set brand_id = excluded.brand_id, position = excluded.position, data = excluded.data, updated_at = now();
  delete from public.posts r
   where r.agency_id = target_agency
     and not exists (select 1 from jsonb_array_elements(items) x where jsonb_typeof(x) = 'object' and x->>'id' = r.id);
end;
$$;
revoke execute on function public.sync_doc_rows_posts(uuid, jsonb) from public, anon, authenticated;

create function public.sync_doc_rows_tasks(target_agency uuid, items jsonb)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.tasks (agency_id, id, brand_id, position, data, updated_at)
  select target_agency, t.x->>'id', nullif(t.x->>'brandId', ''), t.ord, t.x, now()
    from jsonb_array_elements(items) with ordinality as t(x, ord)
   where jsonb_typeof(t.x) = 'object' and coalesce(t.x->>'id', '') <> ''
  on conflict (agency_id, id) do update
    set brand_id = excluded.brand_id, position = excluded.position, data = excluded.data, updated_at = now();
  delete from public.tasks r
   where r.agency_id = target_agency
     and not exists (select 1 from jsonb_array_elements(items) x where jsonb_typeof(x) = 'object' and x->>'id' = r.id);
end;
$$;
revoke execute on function public.sync_doc_rows_tasks(uuid, jsonb) from public, anon, authenticated;

create or replace function public.save_workspace(target_agency uuid, new_data jsonb, expected_version integer)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  next_version integer;
  current_doc jsonb;
  hidden jsonb;
  merged jsonb;
begin
  if coalesce(public.member_role(target_agency), 'viewer') not in ('owner', 'admin', 'editor') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if octet_length(new_data::text) > 8388608 then
    raise exception 'too_large' using errcode = '54000';
  end if;
  if jsonb_typeof(new_data->'brands') is distinct from 'array' or jsonb_typeof(new_data->'posts') is distinct from 'array' then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;
  if public.jsonb_too_deep(new_data) then
    raise exception 'too_deep' using errcode = '54000';
  end if;

  -- Quien solo ve algunas marcas no recibe las demás: su guardado no puede borrarlas ni pisarlas.
  select w.data into current_doc from public.agency_workspaces w where w.agency_id = target_agency;
  select coalesce(jsonb_agg(b), '[]'::jsonb) into hidden
    from jsonb_array_elements(case when jsonb_typeof(current_doc->'brands') = 'array' then current_doc->'brands' else '[]'::jsonb end) b
   where jsonb_typeof(b) = 'object' and coalesce(b->>'id', '') <> '' and not public.can_see_brand(target_agency, b->>'id');
  select coalesce(jsonb_agg(b order by t.ord), '[]'::jsonb) || hidden into merged
    from jsonb_array_elements(new_data->'brands') with ordinality as t(b, ord)
   where not (jsonb_typeof(b) = 'object' and exists (select 1 from jsonb_array_elements(hidden) h where h->>'id' = b->>'id'));
  new_data := jsonb_set(new_data, '{brands}', merged);
  new_data := jsonb_set(new_data, '{posts}', public.keep_hidden_rows(target_agency, current_doc->'posts', new_data->'posts'));
  if jsonb_typeof(new_data->'tasks') = 'array' then
    new_data := jsonb_set(new_data, '{tasks}', public.keep_hidden_rows(target_agency, current_doc->'tasks', new_data->'tasks'));
  end if;

  update public.agency_workspaces
    set data = new_data, version = version + 1, updated_at = now(), updated_by = auth.uid()
    where agency_id = target_agency and version = expected_version
    returning version into next_version;
  if next_version is null then
    raise exception 'stale_version' using errcode = '40001';
  end if;

  insert into public.brands (agency_id, id, name, slug, archived, data, position, updated_at)
  select target_agency, t.b->>'id', coalesce(nullif(t.b->>'name', ''), 'Sin nombre'), coalesce(t.b->>'slug', ''),
         coalesce(t.b->>'status', '') = 'archived' or coalesce(t.b->>'archived', '') = 'true',
         t.b - 'id' - 'name' - 'slug', t.ord, now()
    from jsonb_array_elements(merged) with ordinality as t(b, ord)
   where jsonb_typeof(t.b) = 'object' and coalesce(t.b->>'id', '') <> ''
  on conflict (agency_id, id) do update
    set name = excluded.name, slug = excluded.slug, archived = excluded.archived, data = excluded.data,
        position = excluded.position, updated_at = now();
  delete from public.brands r
   where r.agency_id = target_agency
     and not exists (select 1 from jsonb_array_elements(merged) b where jsonb_typeof(b) = 'object' and b->>'id' = r.id);
  perform public.sync_doc_rows_posts(target_agency, new_data->'posts');
  if jsonb_typeof(new_data->'tasks') = 'array' then
    perform public.sync_doc_rows_tasks(target_agency, new_data->'tasks');
  end if;
  return next_version;
end;
$$;

-- Las marcas de agencias que aún no han guardado desde 0013.
insert into public.brands (agency_id, id, name, slug, archived, data, position)
select w.agency_id, t.b->>'id', coalesce(nullif(t.b->>'name', ''), 'Sin nombre'), coalesce(t.b->>'slug', ''),
       coalesce(t.b->>'status', '') = 'archived' or coalesce(t.b->>'archived', '') = 'true',
       t.b - 'id' - 'name' - 'slug', t.ord
  from public.agency_workspaces w
 cross join lateral jsonb_array_elements(case when jsonb_typeof(w.data->'brands') = 'array' then w.data->'brands' else '[]'::jsonb end) with ordinality as t(b, ord)
 where jsonb_typeof(t.b) = 'object' and coalesce(t.b->>'id', '') <> ''
on conflict (agency_id, id) do nothing;

insert into public.posts (agency_id, id, brand_id, position, data)
select w.agency_id, t.x->>'id', nullif(t.x->>'brandId', ''), t.ord, t.x
  from public.agency_workspaces w
 cross join lateral jsonb_array_elements(case when jsonb_typeof(w.data->'posts') = 'array' then w.data->'posts' else '[]'::jsonb end) with ordinality as t(x, ord)
 where jsonb_typeof(t.x) = 'object' and coalesce(t.x->>'id', '') <> ''
on conflict (agency_id, id) do nothing;

insert into public.tasks (agency_id, id, brand_id, position, data)
select w.agency_id, t.x->>'id', nullif(t.x->>'brandId', ''), t.ord, t.x
  from public.agency_workspaces w
 cross join lateral jsonb_array_elements(case when jsonb_typeof(w.data->'tasks') = 'array' then w.data->'tasks' else '[]'::jsonb end) with ordinality as t(x, ord)
 where jsonb_typeof(t.x) = 'object' and coalesce(t.x->>'id', '') <> ''
on conflict (agency_id, id) do nothing;
