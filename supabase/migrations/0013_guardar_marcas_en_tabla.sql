-- Guardar el espacio actualiza también la tabla de marcas, en la misma transacción: nunca se desincronizan.
-- El documento sigue escribiéndose porque el portal del cliente aún lo lee.

alter table public.brands add column position integer not null default 0;

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
  return next_version;
end;
$$;
