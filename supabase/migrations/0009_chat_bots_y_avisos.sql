-- Bots que reciben eventos y tienen botones; avisos de chat persistentes y por persona.

alter table public.chat_messages add column buttons jsonb;
alter table public.chat_bots
  add column events_url text check (events_url is null or events_url ~ '^https?://'),
  add column events_secret text,
  add column events text[] not null default array['mencion', 'respuesta', 'boton'];
grant select (events_url, events) on public.chat_bots to authenticated;

alter table public.chat_preferences add column viewing_at timestamptz;

create table public.chat_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  agency_id uuid not null references public.agencies(id) on delete cascade,
  message_id uuid references public.chat_messages(id) on delete cascade,
  channel_id uuid references public.chat_channels(id) on delete cascade,
  title text not null,
  body text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index chat_notifications_user on public.chat_notifications (user_id, created_at desc);
alter table public.chat_notifications enable row level security;
create policy chat_notifications_select on public.chat_notifications for select to authenticated
  using (user_id = auth.uid());
create policy chat_notifications_update on public.chat_notifications for update to authenticated
  using (user_id = auth.uid());
revoke all on public.chat_notifications from anon, authenticated;
grant select on public.chat_notifications to authenticated;
grant update (read_at) on public.chat_notifications to authenticated;

-- Avisa a quien mencionan, salvo que lo esté viendo: el navegador renueva viewing_at cada 20 s.
create function public.chat_notify_mentions()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.chat_notifications (user_id, agency_id, message_id, channel_id, title, body)
  select m.user_id, new.agency_id, new.id, new.channel_id, new.sender_name || ' te mencionó', left(new.text, 200)
  from public.agency_members m
  join auth.users u on u.id = m.user_id
  join public.chat_channels c on c.id = new.channel_id
  where m.agency_id = new.agency_id
    and m.user_id <> new.user_id
    and coalesce(u.raw_user_meta_data->>'name', '') <> ''
    and position(lower('@' || (u.raw_user_meta_data->>'name')) in lower(new.text)) > 0
    and ((c.kind not in ('direct', 'self') and cardinality(c.member_ids) = 0) or m.user_id = any (c.member_ids))
    and not exists (
      select 1 from public.chat_preferences p
      where p.channel_id = new.channel_id and p.user_id = m.user_id and p.viewing_at > now() - interval '40 seconds'
    );
  return new;
end;
$$;
create trigger chat_messages_mentions after insert on public.chat_messages
  for each row execute function public.chat_notify_mentions();
revoke execute on function public.chat_notify_mentions() from public, anon, authenticated;

-- Lo vencido ahora incluye recordatorios: salen como aviso aunque su autor no esté.
create or replace function public.chat_flush_due()
returns setof uuid
language plpgsql security definer set search_path = public
as $$
declare
  item public.chat_scheduled;
  due public.chat_reminders;
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
  for due in
    select * from public.chat_reminders where remind_at <= now() for update skip locked
  loop
    select agency_id into channel_agency from public.chat_channels where id = due.channel_id;
    insert into public.chat_notifications (user_id, agency_id, message_id, channel_id, title, body)
    values (due.user_id, channel_agency, due.message_id, due.channel_id, 'Recordatorio del chat', due.text);
    delete from public.chat_reminders where id = due.id;
  end loop;
end;
$$;

-- El bot ahora puede poner botones y responder dentro de un hilo.
drop function public.chat_bot_post(text, text);
create function public.chat_bot_post(bot_token text, body text, bot_buttons jsonb default null, reply_to uuid default null)
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
  if reply_to is not null and not exists (select 1 from public.chat_messages where id = reply_to and channel_id = bot.channel_id) then
    raise exception 'invalid_parent';
  end if;
  insert into public.chat_messages (id, channel_id, agency_id, user_id, bot_id, sender_name, sender_initials, text, buttons, parent_id)
  values (new_id, bot.channel_id, bot.agency_id, bot.id, bot.id, bot.name, upper(left(bot.name, 2)), left(body, 8000), bot_buttons, reply_to);
  return new_id;
end;
$$;
revoke execute on function public.chat_bot_post(text, text, jsonb, uuid) from public;
grant execute on function public.chat_bot_post(text, text, jsonb, uuid) to anon, authenticated;

-- HMAC-SHA256 con lo que trae Postgres: no depende de pgcrypto.
create function public.chat_hmac(secret text, payload text)
returns text
language plpgsql immutable set search_path = public
as $$
declare
  key bytea := convert_to(secret, 'UTF8');
  inner_pad bytea := decode(repeat('36', 64), 'hex');
  outer_pad bytea := decode(repeat('5c', 64), 'hex');
  i int;
begin
  if length(key) > 64 then key := sha256(key); end if;
  for i in 0 .. length(key) - 1 loop
    inner_pad := set_byte(inner_pad, i, get_byte(key, i) # 54);
    outer_pad := set_byte(outer_pad, i, get_byte(key, i) # 92);
  end loop;
  return encode(sha256(outer_pad || sha256(inner_pad || convert_to(payload, 'UTF8'))), 'hex');
end;
$$;
revoke execute on function public.chat_hmac(text, text) from public, anon, authenticated;

-- Configura la URL de eventos y entrega el secreto una sola vez.
create function public.chat_configure_bot(target_bot uuid, url text, wanted text[])
returns text
language plpgsql security definer set search_path = public
as $$
declare
  bot public.chat_bots;
  secret text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  select * into bot from public.chat_bots where id = target_bot;
  if bot.id is null or not (bot.created_by = auth.uid() or public.member_role(bot.agency_id) in ('owner', 'admin')) then
    raise exception 'forbidden';
  end if;
  update public.chat_bots set events_url = nullif(url, ''), events = wanted, events_secret = secret where id = target_bot;
  return secret;
end;
$$;
revoke execute on function public.chat_configure_bot(uuid, text, text[]) from public, anon;
grant execute on function public.chat_configure_bot(uuid, text, text[]) to authenticated;

-- Devuelve qué entregar por un mensaje, ya firmado: quien llama nunca ve el secreto.
create function public.chat_bot_deliveries(target_message uuid, button_id text default null)
returns table (url text, payload text, signature text)
language plpgsql security definer set search_path = public
as $$
declare
  msg public.chat_messages;
  parent_bot uuid;
begin
  select * into msg from public.chat_messages where id = target_message;
  if msg.id is null or not public.chat_can_see(msg.channel_id) then raise exception 'forbidden'; end if;
  if button_id is null and msg.user_id <> auth.uid() then raise exception 'forbidden'; end if;
  select bot_id into parent_bot from public.chat_messages where id = msg.parent_id;
  return query
  with chosen as (
    select b.*, case
      when button_id is not null then 'boton'
      when msg.parent_id is not null and parent_bot = b.id and 'respuesta' = any (b.events) then 'respuesta'
      when position(lower('@' || b.name) in lower(msg.text)) > 0 and 'mencion' = any (b.events) then 'mencion'
      when 'canal' = any (b.events) then 'canal'
    end as kind
    from public.chat_bots b
    where b.channel_id = msg.channel_id and b.events_url is not null and b.events_secret is not null
      and (button_id is null or (b.id = msg.bot_id and 'boton' = any (b.events)))
      and b.id is distinct from (case when button_id is null then msg.bot_id end)
  ), body as (
    select c.events_url as target, c.events_secret as secret, jsonb_build_object(
      'evento', c.kind, 'mensaje_id', msg.id, 'canal_id', msg.channel_id, 'texto', msg.text,
      'autor', msg.sender_name, 'hilo_de', msg.parent_id, 'boton_id', button_id, 'enviado', now()
    )::text as content
    from chosen c where c.kind is not null
  )
  select b.target, b.content, public.chat_hmac(b.secret, b.content) from body b;
end;
$$;
revoke execute on function public.chat_bot_deliveries(uuid, text) from public, anon;
grant execute on function public.chat_bot_deliveries(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.chat_notifications;
  end if;
end;
$$;
