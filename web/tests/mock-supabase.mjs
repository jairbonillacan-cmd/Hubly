// Supabase simulado para pruebas locales: Auth y REST mínimos sobre las migraciones reales en PGlite.
// Uso: node tests/mock-supabase.mjs [puerto]. No sirve para producción: los tokens no van firmados.
import http from "node:http";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

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

  const user = fromAuth(req);
  if (p.startsWith("/rest/v1/rpc/")) {
    const fn = p.slice("/rest/v1/rpc/".length).replace(/\W/g, "");
    const names = Object.keys(body || {});
    const args = names.map((n, i) => `${n.replace(/\W/g, "")} => $${i + 1}`).join(", ");
    try {
      const r = await run(user, `select * from public.${fn}(${args}) as r`, names.map((n) => body[n]));
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
      if (v.startsWith("eq.")) { params.push(v.slice(3)); where.push(`t.${k.replace(/\W/g, "")}::text = $${params.length}`); }
    }
    const order = url.searchParams.get("order");
    const sql = `select ${[list, ...extra].join(",")} from public.${table} t ${where.length ? "where " + where.join(" and ") : ""}
      ${order ? `order by t.${order.split(".")[0].replace(/\W/g, "")}` : ""} ${url.searchParams.get("limit") ? `limit ${Number(url.searchParams.get("limit"))}` : ""}`;
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

http
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
