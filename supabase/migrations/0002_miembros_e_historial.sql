-- Gestión de miembros e invitaciones, e historial de las decisiones del cliente.

create function public.list_members(target_agency uuid)
returns table (user_id uuid, role text, email text, name text)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if public.member_role(target_agency) is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select m.user_id, m.role, u.email, coalesce(u.raw_user_meta_data->>'name', '')
    from public.agency_members m
    join auth.users u on u.id = m.user_id
    where m.agency_id = target_agency
    order by m.created_at;
end;
$$;

create function public.update_member_role(target_agency uuid, target_user uuid, new_role text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if public.member_role(target_agency) is distinct from 'owner' then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if new_role not in ('owner', 'admin', 'editor', 'viewer') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  if new_role <> 'owner'
     and (select m.role from public.agency_members m where m.agency_id = target_agency and m.user_id = target_user) = 'owner'
     and (select count(*) from public.agency_members m where m.agency_id = target_agency and m.role = 'owner') = 1 then
    raise exception 'last_owner' using errcode = '23514';
  end if;
  update public.agency_members m set role = new_role
    where m.agency_id = target_agency and m.user_id = target_user;
end;
$$;

create function public.revoke_invitation(invitation_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  update public.agency_invitations i set revoked_at = now()
    where i.id = invitation_id and i.accepted_at is null
      and coalesce(public.member_role(i.agency_id), '') in ('owner', 'admin');
end;
$$;

-- Lo mínimo para mostrar la invitación antes de aceptarla.
create function public.invitation_preview(raw_token text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select jsonb_build_object('agency', a.name, 'email', i.email, 'role', i.role)
  from public.agency_invitations i
  join public.agencies a on a.id = i.agency_id
  where i.token_hash = public.hash_token(raw_token)
    and i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
$$;

-- Igual que antes, y ahora la decisión también queda en la actividad del post.
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
    set data = jsonb_set(doc, '{posts}', updated), version = version + 1, updated_at = now()
    where agency_id = link.agency_id;
  return true;
end;
$$;

revoke execute on function public.list_members(uuid) from public, anon;
revoke execute on function public.update_member_role(uuid, uuid, text) from public, anon;
revoke execute on function public.revoke_invitation(uuid) from public, anon;
revoke execute on function public.invitation_preview(text) from public;
grant execute on function public.list_members(uuid) to authenticated;
grant execute on function public.update_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.invitation_preview(text) to anon, authenticated;
