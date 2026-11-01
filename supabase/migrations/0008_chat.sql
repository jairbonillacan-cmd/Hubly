-- Chat en tablas propias: cada mensaje es una fila, con RLS por agencia y cambios en vivo.
-- Antes vivía dentro del documento del espacio y dos personas se pisaban al escribir.

create table public.chat_channels (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  kind text not null check (kind in ('general', 'agency', 'brand', 'direct', 'self')),
  name text not null check (length(name) between 1 and 80),
  description text not null default '' check (length(description) <= 300),
  emoji text not null default '' check (length(emoji) <= 16),
  brand_id text,
  -- Identifica el canal único de cada tipo: general, una marca, una pareja o las notas propias.
  -- member_ids vacío en un canal de agencia significa abierto a toda la agencia.
  unique_key text,
  member_ids uuid[] not null default '{}',
  is_archived boolean not null default false,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now(),
  unique (agency_id, unique_key)
);
create index chat_channels_agency on public.chat_channels (agency_id);

create function public.chat_can_see(target_channel uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.chat_channels c
    where c.id = target_channel
      and public.member_role(c.agency_id) is not null
      and ((c.kind not in ('direct', 'self') and cardinality(c.member_ids) = 0) or auth.uid() = any (c.member_ids))
  );
$$;
revoke execute on function public.chat_can_see(uuid) from public, anon;
grant execute on function public.chat_can_see(uuid) to authenticated;

alter table public.chat_channels enable row level security;
create policy chat_channels_select on public.chat_channels for select to authenticated
  using (
    public.member_role(agency_id) is not null
    and ((kind not in ('direct', 'self') and cardinality(member_ids) = 0) or auth.uid() = any (member_ids))
  );
create policy chat_channels_insert on public.chat_channels for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.member_role(agency_id) is not null
    and (kind not in ('direct', 'self') or auth.uid() = any (member_ids))
  );
create policy chat_channels_update on public.chat_channels for update to authenticated
  using (kind = 'agency' and (created_by = auth.uid() or public.member_role(agency_id) in ('owner', 'admin')))
  with check (kind = 'agency' and public.member_role(agency_id) is not null);
create policy chat_channels_delete on public.chat_channels for delete to authenticated
  using (kind = 'agency' and (created_by = auth.uid() or public.member_role(agency_id) in ('owner', 'admin')));
revoke all on public.chat_channels from anon, authenticated;
grant select, insert, delete on public.chat_channels to authenticated;
grant update (name, description, emoji, member_ids, is_archived) on public.chat_channels to authenticated;

create table public.chat_messages (
  -- Lo genera el navegador: así el mensaje propio no se duplica al volver por tiempo real.
  id uuid primary key,
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  -- En un bot es el id del bot: no hay persona detrás.
  user_id uuid not null default auth.uid(),
  bot_id uuid,
  sender_name text not null check (length(sender_name) between 1 and 120),
  sender_initials text not null check (length(sender_initials) <= 4),
  sender_avatar text,
  text text not null default '' check (length(text) <= 8000),
  parent_id uuid references public.chat_messages(id) on delete cascade,
  attachment jsonb,
  pinned boolean not null default false,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  check (length(text) > 0 or attachment is not null)
);
create index chat_messages_channel on public.chat_messages (channel_id, created_at);
create index chat_messages_agency on public.chat_messages (agency_id, created_at desc);
create index chat_messages_parent on public.chat_messages (parent_id);

alter table public.chat_messages enable row level security;
create policy chat_messages_select on public.chat_messages for select to authenticated
  using (public.chat_can_see(channel_id));
create policy chat_messages_insert on public.chat_messages for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.chat_can_see(channel_id)
    and agency_id = (select c.agency_id from public.chat_channels c where c.id = channel_id)
  );
create policy chat_messages_update on public.chat_messages for update to authenticated
  using (user_id = auth.uid() and public.chat_can_see(channel_id));
create policy chat_messages_delete on public.chat_messages for delete to authenticated
  using (
    public.chat_can_see(channel_id)
    and (user_id = auth.uid() or public.member_role(agency_id) in ('owner', 'admin'))
  );
revoke all on public.chat_messages from anon, authenticated;
grant select, insert, delete on public.chat_messages to authenticated;
grant update (text, edited_at) on public.chat_messages to authenticated;

-- Fijar no es editar: cualquiera que vea el canal puede hacerlo, sin poder tocar el texto ajeno.
create function public.chat_set_pinned(target_message uuid, value boolean)
returns void
language plpgsql security definer set search_path = public
as $$
declare target_channel uuid;
begin
  select channel_id into target_channel from public.chat_messages where id = target_message;
  if target_channel is null or not public.chat_can_see(target_channel) then
    raise exception 'forbidden';
  end if;
  update public.chat_messages set pinned = value where id = target_message;
end;
$$;
revoke execute on function public.chat_set_pinned(uuid, boolean) from public, anon;
grant execute on function public.chat_set_pinned(uuid, boolean) to authenticated;

create table public.chat_reactions (
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  user_name text not null,
  emoji text not null check (length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);
alter table public.chat_reactions enable row level security;
create policy chat_reactions_select on public.chat_reactions for select to authenticated
  using (public.chat_can_see((select m.channel_id from public.chat_messages m where m.id = message_id)));
create policy chat_reactions_insert on public.chat_reactions for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.chat_can_see((select m.channel_id from public.chat_messages m where m.id = message_id))
  );
create policy chat_reactions_delete on public.chat_reactions for delete to authenticated
  using (user_id = auth.uid());
revoke all on public.chat_reactions from anon, authenticated;
grant select, insert, delete on public.chat_reactions to authenticated;

-- Lo que cada persona decide sobre un chat: nadie más lo ve.
create table public.chat_preferences (
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  muted boolean not null default false,
  pinned boolean not null default false,
  hidden boolean not null default false,
  last_read_at timestamptz,
  primary key (channel_id, user_id)
);
alter table public.chat_preferences enable row level security;
create policy chat_preferences_own on public.chat_preferences for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.chat_can_see(channel_id));
revoke all on public.chat_preferences from anon, authenticated;
grant select, insert, update, delete on public.chat_preferences to authenticated;

create table public.chat_scheduled (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  sender_name text not null,
  sender_initials text not null,
  sender_avatar text,
  text text not null check (length(text) between 1 and 8000),
  send_at timestamptz not null,
  repeat text not null default 'none' check (repeat in ('none', 'weekly', 'monthly')),
  created_at timestamptz not null default now()
);
alter table public.chat_scheduled enable row level security;
create policy chat_scheduled_own on public.chat_scheduled for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.chat_can_see(channel_id));
revoke all on public.chat_scheduled from anon, authenticated;
grant select, insert, update, delete on public.chat_scheduled to authenticated;

-- Envía lo vencido sin depender de que su autor tenga la app abierta. Con pg_cron corre sola;
-- sin él, la llama cualquier sesión abierta. skip locked evita que dos llamadas envíen lo mismo.
create function public.chat_flush_due()
returns setof uuid
language plpgsql security definer set search_path = public
as $$
declare
  item public.chat_scheduled;
  new_id uuid;
  channel_agency uuid;
  next_at timestamptz;
begin
  for item in
    select * from public.chat_scheduled where send_at <= now() order by send_at for update skip locked
  loop
    select agency_id into channel_agency from public.chat_channels where id = item.channel_id;
    new_id := gen_random_uuid();
    insert into public.chat_messages (id, channel_id, agency_id, user_id, sender_name, sender_initials, sender_avatar, text)
    values (new_id, item.channel_id, channel_agency, item.user_id, item.sender_name, item.sender_initials, item.sender_avatar, item.text);
    return next new_id;
    if item.repeat = 'none' then
      delete from public.chat_scheduled where id = item.id;
    else
      next_at := item.send_at;
      while next_at <= now() loop
        next_at := next_at + (case item.repeat when 'weekly' then interval '7 days' else interval '1 month' end);
      end loop;
      update public.chat_scheduled set send_at = next_at where id = item.id;
    end if;
  end loop;
end;
$$;
revoke execute on function public.chat_flush_due() from public, anon;
grant execute on function public.chat_flush_due() to authenticated;

create table public.chat_reminders (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  message_id uuid not null references public.chat_messages(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  text text not null check (length(text) <= 200),
  remind_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.chat_reminders enable row level security;
create policy chat_reminders_own on public.chat_reminders for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and public.chat_can_see(channel_id));
revoke all on public.chat_reminders from anon, authenticated;
grant select, insert, update, delete on public.chat_reminders to authenticated;

-- Bots: publican en un canal desde Zapier, Make, n8n o un script, con una URL secreta.
create table public.chat_bots (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  channel_id uuid not null references public.chat_channels(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  -- Solo se guarda el hash: la URL completa se enseña una vez.
  token_hash text not null unique,
  created_by uuid not null default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.chat_bots enable row level security;
create policy chat_bots_select on public.chat_bots for select to authenticated
  using (public.chat_can_see(channel_id));
create policy chat_bots_delete on public.chat_bots for delete to authenticated
  using (created_by = auth.uid() or public.member_role(agency_id) in ('owner', 'admin'));
revoke all on public.chat_bots from anon, authenticated;
grant select (id, agency_id, channel_id, name, created_by, created_at) on public.chat_bots to authenticated;
grant delete on public.chat_bots to authenticated;

create function public.chat_create_bot(target_channel uuid, bot_name text)
returns text
language plpgsql security definer set search_path = public
as $$
declare
  channel public.chat_channels;
  token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  select * into channel from public.chat_channels where id = target_channel;
  if channel.id is null or channel.kind in ('direct', 'self') or not public.chat_can_see(target_channel)
    or coalesce(public.member_role(channel.agency_id), '') not in ('owner', 'admin', 'editor') then
    raise exception 'forbidden';
  end if;
  insert into public.chat_bots (agency_id, channel_id, name, token_hash, created_by)
  values (channel.agency_id, target_channel, left(bot_name, 80), encode(sha256(convert_to(token, 'UTF8')), 'hex'), auth.uid());
  return token;
end;
$$;
revoke execute on function public.chat_create_bot(uuid, text) from public, anon;
grant execute on function public.chat_create_bot(uuid, text) to authenticated;

-- Abierta a anon a propósito: el token es la credencial. Limita a 30 mensajes por minuto.
create function public.chat_bot_post(bot_token text, body text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  bot public.chat_bots;
  new_id uuid := gen_random_uuid();
begin
  select * into bot from public.chat_bots where token_hash = encode(sha256(convert_to(bot_token, 'UTF8')), 'hex');
  if bot.id is null then raise exception 'invalid_token'; end if;
  if (select count(*) from public.chat_messages where bot_id = bot.id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'rate_limited';
  end if;
  insert into public.chat_messages (id, channel_id, agency_id, user_id, bot_id, sender_name, sender_initials, text)
  values (new_id, bot.channel_id, bot.agency_id, bot.id, bot.id, bot.name, upper(left(bot.name, 2)), left(body, 8000));
  return new_id;
end;
$$;
revoke execute on function public.chat_bot_post(text, text) from public;
grant execute on function public.chat_bot_post(text, text) to anon, authenticated;

-- Con pg_cron activo, lo programado sale aunque nadie tenga la app abierta.
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('chat-flush-due', '* * * * *', 'select public.chat_flush_due()');
  end if;
end;
$$;

-- Tiempo real. La publicación solo existe en Supabase, no en un Postgres de pruebas.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_channels, public.chat_messages, public.chat_reactions;
  end if;
end;
$$;
