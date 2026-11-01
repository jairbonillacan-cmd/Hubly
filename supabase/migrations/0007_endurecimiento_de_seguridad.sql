-- Endurecimiento tras la auditoría de seguridad del 31 de octubre de 2026.
-- No borra ni reescribe datos: solo ajusta permisos, reglas y funciones.

-- ---------------------------------------------------------------- medios

-- Supabase concede todo por defecto sobre las tablas nuevas de public, y 0004 no lo retiró.
-- La ruta y la agencia de un registro no cambian después de crearlo.
revoke all on public.media_assets from anon, authenticated;
grant select, delete on public.media_assets to authenticated;
grant insert (agency_id, brand_id, folder, name, kind, mime, size_bytes, path, status) on public.media_assets to authenticated;
grant update (folder, name, status) on public.media_assets to authenticated;

-- Un registro de una agencia no puede apuntar a archivos de otra: el portal abre lo que diga esta ruta.
-- El is not null importa: la función devuelve NULL si la ruta no empieza por un UUID y un CHECK
-- con resultado NULL pasa. not valid: aplica a lo nuevo sin revisar filas existentes.
alter table public.media_assets
  add constraint media_assets_path_in_agency check (
    public.media_path_agency(path) is not null and public.media_path_agency(path) = agency_id
  ) not valid;

-- Misma lista que web/lib/media.ts: el tipo declarado en la API no obliga a la subida directa.
update storage.buckets set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/heic', 'image/heif',
  'video/mp4', 'video/quicktime', 'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv'
] where id = 'media';

-- Las URLs públicas de un bucket público no pasan por esta política; con ella abierta
-- cualquiera podía listar las carpetas, y con ellas los ids de todas las cuentas.
drop policy avatars_select on storage.objects;
create policy avatars_select on storage.objects
  for select to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------- agencias y documento

-- Profundidad máxima de un documento: el jsonb no limita el anidamiento y un documento
-- en espiral puede tumbar navegadores y CPU al recorrerlo. La recursión se corta en
-- 100 niveles (nunca profundiza más: no hay riesgo de desbordar la pila de PL/pgSQL).
create function public.jsonb_too_deep(v jsonb, nivel integer default 0)
returns boolean
language plpgsql immutable set search_path = ''
as $$
declare
  e jsonb;
begin
  if nivel > 100 then
    return true;
  end if;
  if jsonb_typeof(v) = 'array' then
    for e in select jsonb_array_elements(v) loop
      if public.jsonb_too_deep(e, nivel + 1) then
        return true;
      end if;
    end loop;
  elsif jsonb_typeof(v) = 'object' then
    for e in select je.value from jsonb_each(v) je loop
      if public.jsonb_too_deep(e, nivel + 1) then
        return true;
      end if;
    end loop;
  end if;
  return false;
end;
$$;
revoke execute on function public.jsonb_too_deep(jsonb, integer) from public, anon, authenticated;

create or replace function public.create_agency(agency_name text)
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
  if (select count(*) from public.agencies a where a.created_by = uid) >= 20 then
    raise exception 'too_many_agencies' using errcode = '54000';
  end if;
  insert into public.agencies (name, created_by) values (trim(agency_name), uid) returning id into new_id;
  insert into public.agency_members (agency_id, user_id, role) values (new_id, uid, 'owner');
  insert into public.agency_workspaces (agency_id, updated_by) values (new_id, uid);
  return new_id;
end;
$$;

-- La misma regla que la API, para quien llame directo a la función con su sesión.
create or replace function public.save_workspace(target_agency uuid, new_data jsonb, expected_version integer)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  next_version integer;
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

-- ---------------------------------------------------------------- miembros e invitaciones

-- Sin correo la invitación sería un link abierto, y los links no pueden dar rol de administración.
create or replace function public.create_invitation(target_agency uuid, invite_email text, invite_role text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  raw text := public.new_token();
begin
  if coalesce(public.member_role(target_agency), '') not in ('owner', 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  -- Solo el dueño crea administradores: un admin no puede sembrar otro admin que le sobreviva.
  if invite_role = 'admin' and public.member_role(target_agency) is distinct from 'owner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(trim(invite_email), '') !~ '^[^[:space:]@]+@[^[:space:]@]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  insert into public.agency_invitations (agency_id, email, role, token_hash, expires_at, created_by)
  values (target_agency, lower(trim(invite_email)), invite_role, public.hash_token(raw), now() + interval '7 days', auth.uid());
  return raw;
end;
$$;

-- Quien sale podría conservar un link abierto: se revocan para que no vuelva a entrar con él.
create or replace function public.remove_member(target_agency uuid, target_user uuid)
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
  -- Quien sale podría conservar un link abierto: se revocan para que no vuelva a entrar con él.
  update public.agency_invitations i set revoked_at = now()
    where i.agency_id = target_agency and i.email is null and i.revoked_at is null;
  -- Y también sus invitaciones por correo pendientes, sin distinguir mayúsculas.
  update public.agency_invitations i set revoked_at = now()
    from auth.users u
   where i.agency_id = target_agency
     and i.accepted_at is null
     and i.revoked_at is null
     and i.email is not null
     and u.id = target_user
     and lower(i.email) = lower(u.email);
end;
$$;

-- ---------------------------------------------------------------- portal de revisión

-- Un enlace filtrado no debe poder inflar el documento hasta impedir que la agencia guarde:
-- como mucho 200 comentarios por post y 200 notificaciones.
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
      and (jsonb_typeof(p->'comments') is distinct from 'array' or jsonb_array_length(p->'comments') < 200)
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
        )) || coalesce((
          select jsonb_agg(n order by ord)
          from jsonb_array_elements(case when jsonb_typeof(doc->'notifications') = 'array' then doc->'notifications' else '[]'::jsonb end)
            with ordinality as t(n, ord)
          where ord < 200
        ), '[]'::jsonb)
      ), version = version + 1, updated_at = now()
    where agency_id = link.agency_id;
  return true;
end;
$$;

-- ---------------------------------------------------------------- portal de revisión (tolerante)

-- El portal no debe romperse aunque el documento tenga formas inesperadas:
-- comments, networks y media llegan siempre como listas, y los elementos que no
-- son objetos se descartan. Guarda los mismos campos públicos que la versión anterior.
create or replace function public.get_share_portal(raw_token text)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  link public.share_links;
  doc jsonb;
  posts jsonb;
begin
  select l.* into link from public.share_links l
    where l.token_hash = public.hash_token(raw_token)
      and l.revoked_at is null and l.expires_at > now();
  if link.id is null then
    return null;
  end if;
  select w.data into doc from public.agency_workspaces w where w.agency_id = link.agency_id;
  posts := case when jsonb_typeof(doc->'posts') = 'array' then doc->'posts' else '[]'::jsonb end;
  return jsonb_build_object(
    'brand', (
      select jsonb_build_object(
        'id', b->'id', 'name', b->'name', 'handle', b->'handle',
        'initials', b->'initials', 'color', b->'color'
      )
      from jsonb_array_elements(case when jsonb_typeof(doc->'brands') = 'array' then doc->'brands' else '[]'::jsonb end) b
      where jsonb_typeof(b) = 'object' and b->>'id' = link.brand_id
      limit 1
    ),
    'posts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p->'id', 'brandId', p->'brandId', 'title', p->'title', 'caption', p->'caption',
        'network', p->'network', 'networks', (
          select coalesce(jsonb_agg(t.v order by t.ord), '[]'::jsonb)
          from jsonb_array_elements(case when jsonb_typeof(p->'networks') = 'array' then p->'networks' else '[]'::jsonb end)
            with ordinality as t(v, ord)
          where jsonb_typeof(t.v) = 'string'
        ),
        'format', p->'format',
        'cover', p->'cover', 'mediaUrl', p->'mediaUrl', 'scheduledDate', p->'scheduledDate',
        'scheduledTime', p->'scheduledTime', 'status', p->'status',
        'comments', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', c->'id', 'author', c->'author', 'text', c->'text', 'createdAt', c->'createdAt'
          ) order by t2.ord), '[]'::jsonb)
          from jsonb_array_elements(case when jsonb_typeof(p->'comments') = 'array' then p->'comments' else '[]'::jsonb end)
            with ordinality as t2(c, ord)
          where jsonb_typeof(t2.c) = 'object'
        ),
        'media', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', m->'id', 'assetId', m->'assetId', 'kind', m->'kind', 'name', m->'name', 'url', m->'url'
          ))
          from jsonb_array_elements(case when jsonb_typeof(p->'media') = 'array' then p->'media' else '[]'::jsonb end) m
          where jsonb_typeof(m) = 'object'
        ), '[]'::jsonb),
        'platformCaptions', (
          select coalesce(jsonb_object_agg(s.key, s.value->'caption'), '{}'::jsonb)
          from jsonb_each(case when jsonb_typeof(p->'platformSettings') = 'object' then p->'platformSettings' else '{}'::jsonb end) s
          where s.value ? 'caption'
        )
      ))
      from jsonb_array_elements(posts) p
      where jsonb_typeof(p) = 'object'
        and p->>'brandId' = link.brand_id
        and p->>'status' in ('pending', 'changes', 'approved', 'scheduled', 'published')
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------- cuota de IA

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'utc')::date,
  requests integer not null default 1,
  primary key (user_id, day)
);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Cuenta una petición y devuelve false al pasar de 100 por día.
create function public.consume_ai_quota()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  counted integer;
begin
  if uid is null then
    return false;
  end if;
  insert into public.ai_usage as u (user_id) values (uid)
    on conflict (user_id, day) do update set requests = u.requests + 1
    where u.requests < 100
    returning u.requests into counted;
  return counted is not null;
end;
$$;

revoke execute on function public.consume_ai_quota() from public, anon;
grant execute on function public.consume_ai_quota() to authenticated;
