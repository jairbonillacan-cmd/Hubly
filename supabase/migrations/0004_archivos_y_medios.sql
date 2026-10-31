-- Archivos reales en Storage privado, medios por post en el portal y etiqueta correcta al aprobar.
-- No usa service_role: Storage se protege con RLS y el portal con un encabezado del token.

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  brand_id text not null,
  folder text not null default '',
  name text not null check (char_length(name) between 1 and 255),
  kind text not null check (kind in ('image', 'video', 'pdf', 'doc')),
  mime text not null,
  size_bytes bigint not null check (size_bytes > 0),
  path text not null unique,
  status text not null default 'pending' check (status in ('pending', 'ready')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index media_assets_brand on public.media_assets (agency_id, brand_id, created_at desc);
alter table public.media_assets enable row level security;
grant select, insert, update, delete on public.media_assets to authenticated;

create policy media_assets_select on public.media_assets
  for select to authenticated using (public.member_role(agency_id) is not null);
create policy media_assets_insert on public.media_assets
  for insert to authenticated with check (public.member_role(agency_id) in ('owner', 'admin', 'editor'));
create policy media_assets_update on public.media_assets
  for update to authenticated
  using (public.member_role(agency_id) in ('owner', 'admin', 'editor'))
  with check (public.member_role(agency_id) in ('owner', 'admin', 'editor'));
create policy media_assets_delete on public.media_assets
  for delete to authenticated using (public.member_role(agency_id) in ('owner', 'admin', 'editor'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', false, 104857600)
on conflict (id) do nothing;

-- La primera carpeta de la ruta es la agencia.
create function public.media_path_agency(object_name text)
returns uuid
language sql immutable set search_path = ''
as $$
  select case
    when split_part(object_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(object_name, '/', 1)::uuid
  end
$$;

-- Un enlace de portal solo abre archivos de los posts que ese mismo enlace muestra.
create function public.share_media_allowed(object_name text)
returns boolean
language plpgsql stable security definer set search_path = ''
as $$
declare
  raw_token text := nullif(current_setting('request.headers', true), '')::json->>'x-hubly-share-token';
  link public.share_links;
  asset public.media_assets;
begin
  if raw_token is null then
    return false;
  end if;
  select l.* into link from public.share_links l
    where l.token_hash = public.hash_token(raw_token)
      and l.revoked_at is null and l.expires_at > now();
  if link.id is null then
    return false;
  end if;
  select a.* into asset from public.media_assets a
    where a.path = object_name and a.agency_id = link.agency_id and a.status = 'ready';
  if asset.id is null then
    return false;
  end if;
  return exists (
    select 1
    from public.agency_workspaces w,
      jsonb_array_elements(coalesce(w.data->'posts', '[]'::jsonb)) p,
      jsonb_array_elements(case when jsonb_typeof(p->'media') = 'array' then p->'media' else '[]'::jsonb end) m
    where w.agency_id = link.agency_id
      and p->>'brandId' = link.brand_id
      and p->>'status' in ('pending', 'changes', 'approved', 'scheduled', 'published')
      and m->>'assetId' = asset.id::text
  );
end;
$$;
grant execute on function public.share_media_allowed(text) to anon, authenticated;
grant execute on function public.media_path_agency(text) to anon, authenticated;
-- Las políticas de abajo la evalúan también para anon; sin sesión siempre devuelve null.
grant execute on function public.member_role(uuid) to anon;

-- Traduce un medio a su ruta solo si el enlace lo muestra.
create function public.share_media_path(raw_token text, asset_id uuid)
returns text
language plpgsql stable security definer set search_path = ''
as $$
declare
  link public.share_links;
  asset_path text;
begin
  select l.* into link from public.share_links l
    where l.token_hash = public.hash_token(raw_token)
      and l.revoked_at is null and l.expires_at > now();
  if link.id is null then
    return null;
  end if;
  select a.path into asset_path from public.media_assets a
    where a.id = asset_id and a.agency_id = link.agency_id and a.status = 'ready';
  if asset_path is null or not exists (
    select 1
    from public.agency_workspaces w,
      jsonb_array_elements(coalesce(w.data->'posts', '[]'::jsonb)) p,
      jsonb_array_elements(case when jsonb_typeof(p->'media') = 'array' then p->'media' else '[]'::jsonb end) m
    where w.agency_id = link.agency_id
      and p->>'brandId' = link.brand_id
      and p->>'status' in ('pending', 'changes', 'approved', 'scheduled', 'published')
      and m->>'assetId' = asset_id::text
  ) then
    return null;
  end if;
  return asset_path;
end;
$$;
grant execute on function public.share_media_path(text, uuid) to anon, authenticated;

create policy media_objects_select on storage.objects
  for select to authenticated, anon using (
    bucket_id = 'media' and (
      public.member_role(public.media_path_agency(name)) is not null
      or public.share_media_allowed(name)
    )
  );
create policy media_objects_insert on storage.objects
  for insert to authenticated with check (
    bucket_id = 'media' and public.member_role(public.media_path_agency(name)) in ('owner', 'admin', 'editor')
  );
create policy media_objects_delete on storage.objects
  for delete to authenticated using (
    bucket_id = 'media' and public.member_role(public.media_path_agency(name)) in ('owner', 'admin', 'editor')
  );

-- El portal recibe solo lo necesario de cada medio; nunca notas, chat ni archivos internos.
create or replace function public.get_share_portal(raw_token text)
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
        'scheduledTime', p->'scheduledTime', 'status', p->'status', 'comments', p->'comments',
        'media', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', m->'id', 'assetId', m->'assetId', 'kind', m->'kind', 'name', m->'name', 'url', m->'url'
          ))
          from jsonb_array_elements(case when jsonb_typeof(p->'media') = 'array' then p->'media' else '[]'::jsonb end) m
        ), '[]'::jsonb),
        'platformCaptions', (
          select coalesce(jsonb_object_agg(s.key, s.value->'caption'), '{}'::jsonb)
          from jsonb_each(case when jsonb_typeof(p->'platformSettings') = 'object' then p->'platformSettings' else '{}'::jsonb end) s
          where s.value ? 'caption'
        )
      ))
      from jsonb_array_elements(coalesce(doc->'posts', '[]'::jsonb)) p
      where p->>'brandId' = link.brand_id
        and p->>'status' in ('pending', 'changes', 'approved', 'scheduled', 'published')
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.submit_share_decision(
  raw_token text, target_post text, decision text, comment_text text, signer text
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  link public.share_links;
  doc jsonb;
  updated jsonb;
  allowed boolean;
  post_title text;
  label text;
  who text := left(coalesce(nullif(trim(signer), ''), 'Cliente'), 80);
begin
  if decision not in ('approved', 'changes') then
    raise exception 'invalid_decision' using errcode = '22023';
  end if;
  if decision = 'changes' and coalesce(trim(comment_text), '') = '' then
    raise exception 'comment_required' using errcode = '22023';
  end if;
  label := case decision when 'approved' then 'Aprobado' else 'Requiere cambios' end;
  select l.* into link from public.share_links l
    where l.token_hash = public.hash_token(raw_token)
      and l.revoked_at is null and l.expires_at > now();
  if link.id is null then
    return false;
  end if;
  select w.data into doc from public.agency_workspaces w where w.agency_id = link.agency_id for update;
  select exists (
    select 1 from jsonb_array_elements(coalesce(doc->'posts', '[]'::jsonb)) p
    where p->>'id' = target_post and p->>'brandId' = link.brand_id
      and p->>'status' in ('pending', 'changes', 'approved')
  ) into allowed;
  if not allowed then
    return false;
  end if;
  select p->>'title' into post_title
    from jsonb_array_elements(doc->'posts') p where p->>'id' = target_post limit 1;
  select jsonb_agg(
    case when p->>'id' = target_post
      then p || jsonb_build_object(
        'status', decision,
        'statusLabel', label,
        'comments', coalesce(p->'comments', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
          'id', 'c-' || gen_random_uuid()::text,
          'author', who,
          'role', 'client',
          'text', left(coalesce(nullif(trim(comment_text), ''), 'Aprobado desde el enlace de revisión.'), 2000),
          'createdAt', to_char(now(), 'YYYY-MM-DD HH24:MI')
        )),
        'activity', jsonb_build_array(jsonb_build_object(
          'id', 'pa-' || gen_random_uuid()::text,
          'author', who || ' (firma, sin cuenta)',
          'text', case decision when 'approved' then 'Aprobó desde el enlace de revisión' else 'Pidió cambios desde el enlace de revisión' end,
          'at', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
        )) || coalesce(p->'activity', '[]'::jsonb)
      )
      else p
    end
    order by ord
  )
  into updated
  from jsonb_array_elements(doc->'posts') with ordinality as t(p, ord);
  update public.agency_workspaces
    set data = jsonb_set(
        jsonb_set(doc, '{posts}', updated),
        '{notifications}',
        jsonb_build_array(jsonb_build_object(
          'id', 'n-' || gen_random_uuid()::text,
          'brandId', link.brand_id,
          'title', case decision when 'approved' then who || ' aprobó un post' else who || ' pidió cambios' end,
          'body', coalesce(post_title, ''),
          'createdAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'read', false,
          'kind', 'aprobacion',
          'actionUrl', '/parrillas'
        )) || coalesce(doc->'notifications', '[]'::jsonb)
      ), version = version + 1, updated_at = now()
    where agency_id = link.agency_id;
  return true;
end;
$$;
