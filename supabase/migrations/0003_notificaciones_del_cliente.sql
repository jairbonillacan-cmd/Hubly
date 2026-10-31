-- Avisa al equipo cuando el cliente decide desde su enlace de revisión.

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
  label := case decision when 'approved' then 'Programado' else 'Requiere cambios' end;
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
