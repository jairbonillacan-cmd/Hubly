-- Link de invitación: sin correo fijo, sirve para varias personas hasta caducar o revocarse.
alter table public.agency_invitations alter column email drop not null;

create function public.create_invite_link(target_agency uuid, invite_role text)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  raw text := public.new_token();
begin
  if coalesce(public.member_role(target_agency), '') not in ('owner', 'admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  -- Quien tenga el link no debe poder administrar la agencia.
  if invite_role not in ('editor', 'viewer') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  insert into public.agency_invitations (agency_id, email, role, token_hash, expires_at, created_by)
  values (target_agency, null, invite_role, public.hash_token(raw), now() + interval '7 days', auth.uid());
  return raw;
end;
$$;

-- Con correo sigue siendo de un solo uso. Con link basta tener un correo verificado.
create or replace function public.accept_invitation(raw_token text)
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
  if user_email is null or (inv.email is not null and user_email <> inv.email) then
    raise exception 'email_mismatch' using errcode = '42501';
  end if;
  insert into public.agency_members (agency_id, user_id, role)
    values (inv.agency_id, uid, inv.role)
    on conflict (agency_id, user_id) do nothing;
  if inv.email is not null then
    update public.agency_invitations set accepted_at = now() where id = inv.id;
  end if;
  return inv.agency_id;
end;
$$;

revoke execute on function public.create_invite_link(uuid, text) from public, anon;
grant execute on function public.create_invite_link(uuid, text) to authenticated;
