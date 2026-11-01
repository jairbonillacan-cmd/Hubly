// Supabase simulado para pruebas locales: Auth y REST mínimos sobre las migraciones reales en PGlite.
// Uso: node tests/mock-supabase.mjs [puerto]. No sirve para producción: los tokens no van firmados.
import http from "node:http";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { WebSocketServer } from "ws";

const PORT = Number(process.argv[2] || 54399);
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[:array_length(string_to_array(name, '/'), 1) - 1] $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
`);
const dir = new URL("../../supabase/migrations/", import.meta.url);
for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(new URL(f, dir), "utf8"));

const users = new Map(); // email -> { id, email, password, name }
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const tokenFor = (u) => {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return [b64({ alg: "HS256", typ: "JWT" }), b64({ sub: u.id, email: u.email, exp, role: "authenticated", aud: "authenticated" }), "mock"].join(".");
};
const userJson = (u) => ({
  id: u.id, aud: "authenticated", role: "authenticated", email: u.email,
  email_confirmed_at: new Date().toISOString(), confirmed_at: new Date().toISOString(),
  user_metadata: { name: u.name }, app_metadata: { provider: "email" }, created_at: new Date().toISOString(),
});
const session = (u) => ({
  access_token: tokenFor(u), token_type: "bearer", expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: `r-${u.id}`, user: userJson(u),
});
const fromAuth = (req) => {
  const raw = (req.headers.authorization || "").replace("Bearer ", "");
  try {
    const sub = JSON.parse(Buffer.from(raw.split(".")[1], "base64url")).sub;
    return [...users.values()].find((u) => u.id === sub) || null;
  } catch {
    return null;
  }
};

// Una sola conexión: cada consulta fija su identidad y su rol, en serie.
let queue = Promise.resolve();
function run(user, sql, params) {
  const task = queue.then(async () => {
    await db.exec(`reset role; select set_config('test.uid','${user?.id || ""}',false); set role ${user ? "authenticated" : "anon"};`);
    try {
      return await db.query(sql, params);
    } finally {
      await db.exec("reset role");
    }
  });
  queue = task.catch(() => {});
  return task;
}

async function handle(req, res, body, url) {
  const send = (status, json) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(json === undefined ? "" : JSON.stringify(json));
  };
  const p = url.pathname;
  if (p === "/auth/v1/signup") {
    if (users.has(body.email)) return send(422, { msg: "User already registered", error_code: "user_already_exists" });
    const u = { id: randomUUID(), email: body.email, password: body.password, name: body.data?.name || "" };
    users.set(body.email, u);
    await db.query(`insert into auth.users (id, email, email_confirmed_at, raw_user_meta_data) values ($1,$2,now(),$3)`, [u.id, u.email, { name: u.name }]);
    return send(200, session(u));
  }
  if (p === "/auth/v1/token") {
    if (url.searchParams.get("grant_type") === "refresh_token") {
      const u = [...users.values()].find((x) => `r-${x.id}` === body.refresh_token);
      return u ? send(200, session(u)) : send(400, { msg: "Invalid Refresh Token", error_code: "refresh_token_not_found" });
    }
    const u = users.get(body.email);
    if (!u || u.password !== body.password) return send(400, { msg: "Invalid login credentials", error_code: "invalid_credentials" });
    return send(200, session(u));
  }
  if (p === "/auth/v1/user") {
    const u = fromAuth(req);
    return u ? send(200, userJson(u)) : send(401, { msg: "invalid token", error_code: "bad_jwt" });
  }
  if (p === "/auth/v1/logout") return send(204);

  if (p === "/v1/messages") {
    const brief = body.messages?.[0]?.content || "";
    return send(200, {
      id: "msg_mock", type: "message", role: "assistant", model: body.model, stop_reason: "end_turn", stop_sequence: null,
      usage: { input_tokens: 1, output_tokens: 1 },
      content: [{ type: "text", text: `[respuesta simulada] ${brief}` }],
    });
  }

  // Solo para pruebas: da de alta a alguien en una agencia sin pasar por una invitación.
  if (p === "/__test/member") {
    await db.query(`insert into public.agency_members (agency_id, user_id, role) values ($1,$2,$3)`, [body.agencyId, body.userId, body.role || "editor"]);
    return send(200, { ok: true });
  }

  const user = fromAuth(req);
  if (p.startsWith("/rest/v1/rpc/")) {
    const fn = p.slice("/rest/v1/rpc/".length).replace(/\W/g, "");
    const names = Object.keys(body || {});
    const args = names.map((n, i) => `${n.replace(/\W/g, "")} => $${i + 1}`).join(", ");
    try {
      const r = await run(user, `select * from public.${fn}(${args}) as r`, names.map((n) => body[n]));
      if (fn === "chat_bot_post" || fn === "chat_flush_due") {
        for (const row of r.rows) {
          const created = (await db.query(`select * from public.chat_messages where id = $1`, [row.r])).rows[0];
          if (created) emitChange("chat_messages", "INSERT", created);
        }
      }
      if (fn === "chat_set_pinned") {
        const row = (await db.query(`select * from public.chat_messages where id = $1`, [body.target_message])).rows[0];
        if (row) emitChange("chat_messages", "UPDATE", row);
      }
      if (fn === "chat_flush_due") return send(200, r.rows.map((row) => row.r));
      if (r.fields.length === 1 && r.fields[0].name === "r") return send(200, r.rows[0]?.r ?? null);
      return send(200, r.rows);
    } catch (e) {
      return send(400, { message: e.message, code: e.code });
    }
  }
  if (p.startsWith("/rest/v1/")) {
    const table = p.slice("/rest/v1/".length).replace(/\W/g, "");
    const select = url.searchParams.get("select") || "*";
    const embeds = [...select.matchAll(/(\w+)\(([^)]*)\)/g)].map((m) => m[1]);
    const cols = select.replace(/\w+\([^)]*\)/g, "").split(",").map((c) => c.trim()).filter(Boolean);
    const list = cols.includes("*") || !cols.length ? "t.*" : cols.map((c) => `t.${c.replace(/\W/g, "")}`).join(",");
    const extra = embeds.map((e) => `(select to_jsonb(a) from public.${e} a where a.id = t.agency_id) as ${e}`);
    const where = [], params = [];
    for (const [k, v] of url.searchParams) {
      if (["select", "limit", "order", "offset"].includes(k)) continue;
      if (k === "columns" || k === "on_conflict") continue;
      if (v.startsWith("eq.")) { params.push(v.slice(3)); where.push(`t.${k.replace(/\W/g, "")}::text = $${params.length}`); }
      if (v === "is.null") where.push(`t.${k.replace(/\W/g, "")} is null`);
      if (v.startsWith("neq.")) { params.push(v.slice(4)); where.push(`t.${k.replace(/\W/g, "")}::text <> $${params.length}`); }
      if (v.startsWith("gt.") || v.startsWith("lt.")) { params.push(v.slice(3)); where.push(`t.${k.replace(/\W/g, "")} ${v[0] === "g" ? ">" : "<"} $${params.length}::timestamptz`); }
      if (v.startsWith("ilike.")) { params.push(v.slice(6).replaceAll("*", "%")); where.push(`t.${k.replace(/\W/g, "")} ilike $${params.length}`); }
      if (v.startsWith("in.(")) {
        const values = v.slice(4, -1).split(",").map((x) => x.replace(/^"|"$/g, ""));
        params.push(values);
        where.push(`t.${k.replace(/\W/g, "")}::text = any($${params.length})`);
      }
    }
    const whereSql = where.length ? "where " + where.join(" and ") : "";
    try {
      if (req.method !== "GET") return send(...(await write(user, req, table, body, url, whereSql, params)));
    } catch (e) {
      return send(e.code === "42501" ? 403 : 400, { message: e.message, code: e.code });
    }
    const order = url.searchParams.get("order");
    const sql = `select ${[list, ...extra].join(",")} from public.${table} t ${whereSql}
      ${order ? `order by t.${order.split(".")[0].replace(/\W/g, "")} ${order.includes(".desc") ? "desc" : ""}` : ""} ${url.searchParams.get("limit") ? `limit ${Number(url.searchParams.get("limit"))}` : ""}`;
    try {
      const { rows } = await run(user, sql, params);
      if ((req.headers.accept || "").includes("vnd.pgrst.object")) {
        return rows.length === 1 ? send(200, rows[0]) : send(406, { message: "JSON object requested", code: "PGRST116" });
      }
      return send(200, rows);
    } catch (e) {
      return send(400, { message: e.message, code: e.code });
    }
  }
  send(404, { message: "not found" });
}

const param = (v) => (v !== null && typeof v === "object" && !Array.isArray(v) ? JSON.stringify(v) : v);

/** Escrituras REST con las reglas reales: se ejecutan con el rol y la identidad de quien llama. */
async function write(user, req, table, body, url, whereSql, params) {
  const name = `public.${table}`;
  if (req.method === "POST") {
    const rows = Array.isArray(body) ? body : [body];
    const prefer = req.headers.prefer || "";
    const conflict = url.searchParams.get("on_conflict");
    for (const row of rows) {
      const keys = Object.keys(row).map((k) => k.replace(/\W/g, ""));
      const marks = keys.map((_, i) => `$${i + 1}`).join(",");
      let tail = "";
      if (prefer.includes("ignore-duplicates")) tail = ` on conflict ${conflict ? `(${conflict})` : ""} do nothing`;
      else if (prefer.includes("merge-duplicates")) tail = ` on conflict (${conflict}) do update set ${keys.filter((k) => !conflict.split(",").includes(k)).map((k) => `${k} = excluded.${k}`).join(",")}`;
      const r = await run(user, `insert into ${name} (${keys.join(",")}) values (${marks})${tail} returning *`, Object.values(row).map(param));
      for (const created of r.rows) emitChange(table, "INSERT", created);
    }
    return [201];
  }
  if (req.method === "PATCH") {
    const keys = Object.keys(body).map((k) => k.replace(/\W/g, ""));
    const sets = keys.map((k, i) => `${k} = $${params.length + i + 1}`).join(",");
    const r = await run(user, `update ${name} t set ${sets} ${whereSql} returning *`, [...params, ...Object.values(body).map(param)]);
    for (const changed of r.rows) emitChange(table, "UPDATE", changed);
    return [204];
  }
  const r = await run(user, `delete from ${name} t ${whereSql} returning *`, params);
  for (const gone of r.rows) emitChange(table, "DELETE", gone);
  return [204];
}

// Realtime mínimo: el protocolo Phoenix de Supabase, con RLS aplicada a cada suscriptor.
const sockets = new Set();
const PRIMARY = { chat_channels: ["id"], chat_messages: ["id"], chat_reactions: ["message_id", "user_id", "emoji"], chat_notifications: ["id"] };

function frame(ws, joinRef, ref, topic, event, payload) {
  const out = ws.vsn2 ? JSON.stringify([joinRef, ref, topic, event, payload]) : JSON.stringify({ join_ref: joinRef, ref, topic, event, payload });
  if (ws.readyState === 1) ws.send(out);
}

function emitChange(table, type, row) {
  const keys = PRIMARY[table];
  if (!keys) return;
  // El disparador de avisos no pasa por REST: se publica aquí lo que haya creado.
  if (table === "chat_messages" && type === "INSERT") {
    db.query(`select * from public.chat_notifications where message_id = $1`, [row.id]).then((r) => {
      for (const notice of r.rows) emitChange("chat_notifications", "INSERT", notice);
    });
  }
  const record = type === "DELETE" ? {} : row;
  // Como Supabase con RLS: un borrado solo trae la llave primaria.
  const old_record = type === "DELETE" ? Object.fromEntries(keys.map((k) => [k, row[k]])) : {};
  const columns = Object.keys(type === "DELETE" ? old_record : row).map((name) => ({ name, type: "text" }));
  for (const ws of sockets) {
    for (const join of ws.joins.values()) {
      const ids = join.bindings
        .filter((b) => b.table === table && (b.event === "*" || b.event === type))
        .filter((b) => {
          if (!b.filter || type === "DELETE") return !b.filter;
          const [col, value] = b.filter.split("=eq.");
          return String(row[col]) === value;
        })
        .map((b) => b.id);
      if (ids.length === 0) continue;
      const visible = type === "DELETE"
        ? Promise.resolve(true)
        : run(ws.user, `select 1 from public.${table} where ${keys.map((k, i) => `${k}::text = $${i + 1}`).join(" and ")}`, keys.map((k) => String(row[k]))).then((r) => r.rows.length > 0, () => false);
      visible.then((ok) => {
        if (!ok) return;
        frame(ws, join.joinRef, null, join.topic, "postgres_changes", {
          ids,
          data: { type, schema: "public", table, commit_timestamp: new Date().toISOString(), errors: null, columns, record, old_record },
        });
      });
    }
  }
}

function presenceOf(topic) {
  const state = {};
  for (const ws of sockets) {
    const join = ws.joins.get(topic);
    if (join?.presenceKey) state[join.presenceKey] = { metas: [{ phx_ref: `${join.presenceKey}-ref`, ...(join.meta || {}) }] };
  }
  return state;
}

/** El cliente manda sus broadcasts en binario: tipo, seis longitudes y luego cada campo. */
function decodeBroadcast(buf) {
  const [joinLen, refLen, topicLen, eventLen, metaLen, encoding] = buf.subarray(1, 7);
  let at = 7;
  const take = (n) => buf.subarray(at, (at += n)).toString("utf8");
  const joinRef = take(joinLen);
  const ref = take(refLen);
  const topic = take(topicLen);
  const event = take(eventLen);
  take(metaLen);
  const body = buf.subarray(at).toString("utf8");
  return [joinRef, ref, topic, "broadcast", { type: "broadcast", event, payload: encoding === 1 ? JSON.parse(body) : body }];
}

function onSocketMessage(ws, raw, isBinary) {
  const parsed = isBinary ? decodeBroadcast(raw) : JSON.parse(raw.toString());
  const isArray = Array.isArray(parsed);
  if (isArray) ws.vsn2 = true;
  const [joinRef, ref, topic, event, payload] = isArray
    ? parsed
    : [parsed.join_ref, parsed.ref, parsed.topic, parsed.event, parsed.payload];
  const reply = (response = {}) => frame(ws, joinRef, ref, topic, "phx_reply", { status: "ok", response });
  if (event === "heartbeat" || event === "access_token") return reply();
  if (event === "phx_join") {
    const token = payload.access_token || "";
    try {
      const sub = JSON.parse(Buffer.from(token.split(".")[1], "base64url")).sub;
      ws.user = [...users.values()].find((u) => u.id === sub) || null;
    } catch {
      ws.user = null;
    }
    let next = 1;
    const bindings = (payload.config?.postgres_changes || []).map((b) => ({ ...b, id: next++ }));
    ws.joins.set(topic, { topic, joinRef: joinRef ?? ref, bindings, presenceKey: payload.config?.presence?.key || null });
    reply({ postgres_changes: bindings });
    frame(ws, joinRef ?? ref, null, topic, "presence_state", presenceOf(topic));
    return;
  }
  if (event === "phx_leave") {
    ws.joins.delete(topic);
    return reply();
  }
  if (event === "presence") {
    const join = ws.joins.get(topic);
    if (join) join.meta = payload.payload;
    reply();
    for (const other of sockets) {
      const j = other.joins.get(topic);
      if (j) frame(other, j.joinRef, null, topic, "presence_state", presenceOf(topic));
    }
    return;
  }
  if (event === "broadcast") {
    reply();
    for (const other of sockets) {
      const j = other.joins.get(topic);
      if (other !== ws && j) frame(other, j.joinRef, null, topic, "broadcast", payload);
    }
  }
}

const server = http
  .createServer((req, res) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
    res.setHeader("Access-Control-Allow-Headers", req.headers["access-control-request-headers"] || "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      return res.end();
    }
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {}
      handle(req, res, body, new URL(req.url, "http://x")).catch((e) => {
        res.writeHead(500);
        res.end(JSON.stringify({ message: String(e) }));
      });
    });
  })
  .listen(PORT, () => console.log(`mock-supabase en http://localhost:${PORT}`));

new WebSocketServer({ server, path: "/realtime/v1/websocket" }).on("connection", (ws) => {
  ws.joins = new Map();
  ws.user = null;
  sockets.add(ws);
  ws.on("message", (raw, isBinary) => {
    try {
      onSocketMessage(ws, raw, isBinary);
    } catch (e) {
      console.error("realtime simulado:", e);
    }
  });
  ws.on("close", () => {
    const topics = [...ws.joins.keys()];
    sockets.delete(ws);
    for (const topic of topics) {
      for (const other of sockets) {
        const j = other.joins.get(topic);
        if (j) frame(other, j.joinRef, null, topic, "presence_state", presenceOf(topic));
      }
    }
  });
});
