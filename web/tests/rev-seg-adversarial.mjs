// Segunda revisión de seguridad: pruebas adversariales contra el esquema real (PGlite).
// Uso: node tests/rev-seg-adversarial.mjs   (no forma parte de la suite del proyecto)
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";

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
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[:cardinality(string_to_array(name, '/')) - 1] $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant execute on function storage.foldername(text) to anon, authenticated;
  grant select, insert, delete on storage.objects to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on functions to anon, authenticated;
`);
const dir = new URL("../../supabase/migrations/", import.meta.url);
for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(new URL(f, dir), "utf8"));

const uuid = (c) => `${c.repeat(8)}-${c.repeat(4)}-4${c.repeat(3)}-8${c.repeat(3)}-${c.repeat(12)}`;
const [O, AD, ED, VU, XE] = ["a", "b", "c", "d", "e"].map(uuid);
await db.query(
  `insert into auth.users values ($1,'o@x.com',now()),($2,'ad@x.com',now()),($3,'ed@x.com',now()),($4,'vu@x.com',now()),($5,'xe@x.com',now())`,
  [O, AD, ED, VU, XE]
);
async function as(uid, role, sql, params = []) {
  await db.exec(`reset role; select set_config('test.uid','${uid || ""}',false); set role ${role};`);
  try {
    return (await db.query(sql, params)).rows;
  } finally {
    await db.exec("reset role");
  }
}
const auth = (uid, sql, p) => as(uid, "authenticated", sql, p);
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { if (cond) pass++; else fail++; console.log(`${cond ? "ok  " : "HALLAZGO"} ${name}${cond ? "" : " -> " + extra}`); };
const trySql = async (name, uid, sql, params) => {
  try { const r = await auth(uid, sql, params); ok(name + " (permitido)", true); return r; }
  catch (e) { ok(name + " (bloqueado)", false, e.message.slice(0, 90)); return null; }
};
const mustFail = async (name, uid, sql, params, code) => {
  try { await auth(uid, sql, params); ok(name, false, "no lanzó"); }
  catch (e) { ok(name, true, e.message.slice(0, 60)); void code; }
};

// --- montaje: owner O con admin AD, editor ED y viewer VU; XE ajeno
const ag = (await auth(O, `select public.create_agency('Ag') id`))[0].id;
await db.query(`insert into public.agency_members values ($1,$2,'admin'),($1,$3,'editor'),($1,$4,'viewer')`, [ag, AD, ED, VU]);

// 1) Escaladas por RPC
await trySql("ADMIN crea invitación con rol admin", AD, `select public.create_invitation($1,'nuevo@x.com','admin')`, [ag]);
await mustFail("EDITOR no crea invitación", ED, `select public.create_invitation($1,'nuevo@x.com','viewer')`, [ag]);
await mustFail("ADMIN no cambia roles", AD, `select public.update_member_role($1,$2,'owner')`, [ag, VU]);
await mustFail("ADMIN no elimina miembros", AD, `select public.remove_member($1,$2)`, [ag, VU]);
{
  // Por diseño los editores sí pueden crear enlaces de portal (0001: owner/admin/editor).
  let edLink = null;
  try { edLink = (await auth(ED, `select public.create_share_link($1,'b1') t`, [ag]))[0].t; } catch {}
  ok("EDITOR sí crea link de portal (por diseño, se anota)", Boolean(edLink));
}
await mustFail("VIEWER no crea link de portal", VU, `select public.create_share_link($1,'b1')`, [ag]);
await mustFail("VIEWER no guarda documento", VU, `select public.save_workspace($1,'{"brands":[],"posts":[]}',1)`, [ag]);
await mustFail("AJENO no lista equipo", XE, `select public.list_members($1)`, [ag]);
{
  // La cuota es por persona; la ruta comprueba aparte que sea miembro editor.
  const q = (await auth(XE, `select public.consume_ai_quota() q`))[0]?.q;
  ok("consume_ai_quota cuenta a cualquier autenticado (la ruta filtra antes)", q === true);
}

// 2) update_member_role: dueño se autodegrada habiendo otro dueño (¿queda sin dueño?)
await db.query(`update public.agency_members set role='owner' where agency_id=$1 and user_id=$2`, [ag, AD]); // ahora hay 2 dueños
const rSelf = await auth(O, `select public.update_member_role($1,$2,'viewer')`, [ag, O]);
ok("dueño se degrada con otro dueño presente", Array.isArray(rSelf));
const roles = (await db.query("select role, count(*) c from public.agency_members where agency_id=$1 group by role", [ag])).rows;
ok("queda al menos un dueño", roles.some((r) => r.role === "owner" && Number(r.c) >= 1));
await auth(AD, `select public.update_member_role($1,$2,'owner')`, [ag, O]); // restaurar para el resto

// 3) CHECK de 0010 con prefijo no-UUID (NULL pasa la restricción)
const insertAsset = `insert into public.media_assets (agency_id, brand_id, name, kind, mime, size_bytes, path, status) values ($1,'b1','x.png','image','image/png',10,$2,'ready') returning id`;
let nonUuidAsset = null;
try {
  nonUuidAsset = (await auth(ED, insertAsset, [ag, "sin-uuid/carpeta/x.png"]))[0].id;
  ok("HALLAZGO: path con prefijo no-UUID pasa el CHECK media_assets_path_in_agency", true);
} catch (e) {
  ok("path con prefijo no-UUID es rechazado por el CHECK", false, e.message.slice(0, 80));
}
// ¿ese registro abre algo en Storage? La política exige member_role(media_path_agency(name)) y es NULL.
if (nonUuidAsset) {
  await db.query(`insert into storage.objects (bucket_id, name) values ('media','sin-uuid/carpeta/x.png')`).catch(() => {});
  const vis = await auth(VU, `select count(*) c from storage.objects where name='sin-uuid/carpeta/x.png'`);
  ok("objeto con prefijo no-UUID invisible vía member_role", Number(vis[0].c) === 0);
}

// 4) upsert (ON CONFLICT) con permisos por columna: ¿lo permite Postgres?
try {
  await auth(ED, `insert into public.media_assets (agency_id, brand_id, name, kind, mime, size_bytes, path) values ($1,'b1','y.png','image','image/png',10,$2)
                  on conflict (path) do update set name = 'secuestrado'`, [ag, "sin-uuid/carpeta/x.png"]);
  ok("HALLAZGO: upsert sobre media_assets funciona con permisos de columna", true);
} catch (e) {
  ok("upsert sobre media_assets bloqueado por permisos de columna", false, e.message.slice(0, 90));
}

// 5) insert con returning * (lo que hace PostgREST con return=representation)
try {
  const r = await auth(ED, `insert into public.media_assets (agency_id, brand_id, name, kind, mime, size_bytes, path, status) values ($1,'b1','z.png','image','image/png',10,$2,'ready') returning *`, [ag, `${ag}/b/z.png`]);
  ok("insert ... returning * funciona con permisos por columna", r.length === 1);
} catch (e) { ok("insert ... returning * funciona con permisos por columna", false, e.message.slice(0, 90)); }

// 6) share_media_allowed / share_media_path con cabecera manipulada
const zId = (await auth(O, `select id from public.media_assets where name='z.png'`))[0]?.id;
const doc = { brands: [{ id: "b1", name: "M" }], posts: [
  { id: "p1", brandId: "b1", title: "T", status: "pending", comments: [],
    media: [{ id: "m", assetId: zId, kind: "image", name: "z.png" }] }] };
await db.query(`update public.agency_workspaces set data=$2 where agency_id=$1`, [ag, JSON.stringify(doc)]);
await db.query(`insert into storage.objects (bucket_id, name) values ('media',$1)`, [`${ag}/b/z.png`]).catch(() => {});
const tok = (await auth(O, `select public.create_share_link($1,'b1') t`, [ag]))[0].t;
const conHeader = async (headerValue) => {
  const hdr = JSON.stringify({ "x-hubly-share-token": headerValue }).replace(/'/g, "''");
  await db.exec("reset role;");
  await db.exec(`select set_config('test.uid','',false)`);
  await db.exec(`select set_config('request.headers', $1::text, false)`.replace("$1::text", `'${hdr}'`));
  await db.exec(`set role anon;`);
  try {
    return (await db.query(`select count(*)::int c from storage.objects where name = $1`, [`${ag}/b/z.png`])).rows;
  } finally {
    await db.exec("reset role; select set_config('request.headers','',false)");
  }
};
let pol = await conHeader(tok);
ok("token válido abre su medio", Number(pol?.[0]?.c) === 1);
// token con JSON/XML intentos de inyección en la cabecera
for (const evil of ['"x"', "'", '"} or 1=1--', tok + '" , "otro": "1', tok + "' --"]) {
  let c = "?";
  try { c = Number((await conHeader(evil))[0]?.c); } catch (e) { c = "err:" + e.message.slice(0, 40); }
  ok(`cabecera maliciosa (${evil.slice(0, 12)}…) no abre medios`, c === 0, String(c));
}

// 7) submit_share_decision con comments en forma inesperada (objeto)
await db.query(`update public.agency_workspaces set data = jsonb_set(data,'{posts,0,comments}','{"a":"b"}'::jsonb) where agency_id=$1`, [ag]);
let dec = "sin-ejecutar";
try {
  dec = (await as(null, "anon", `select public.submit_share_decision($1,'p1','approved','','X') r`, [tok]))[0].r;
  const after = (await db.query(`select data->'posts'->0->'comments' c from public.agency_workspaces where agency_id=$1`, [ag])).rows;
  ok("comments=object no revienta la decisión", dec === true && JSON.stringify(after[0].c).includes("["));
} catch (e) { ok("comments=object no revienta la decisión", false, e.message.slice(0, 100)); }

// 8) anidamiento profundo de JSON (¿cae el parser?)
const deep = { brands: [], posts: [], x: null };
let node = deep; for (let i = 0; i < 50000; i++) { node.x = { x: null }; node = node.x; }
try {
  await auth(O, `select public.save_workspace($1,$2,(select version from public.agency_workspaces where agency_id=$1))`, [ag, JSON.stringify(deep)]);
  ok("HALLAZGO: JSON 50k niveles de anidamiento se guarda", true);
} catch (e) { ok("JSON profundamente anidado rechazado por el parser", false, e.message.slice(0, 90)); }

// 9) create_agency: límite de 20 por cuenta
let created = 0, lastErr = null;
const existing = Number((await db.query(`select count(*) c from public.agencies where created_by=$1`, [XE])).rows[0].c);
for (let i = 0; i < 21 - Number(existing); i++) {
  try { await auth(XE, `select public.create_agency('X${i}')`); created++; } catch (e) { lastErr = e.message; }
}
ok(`límite de agencias (creadas ${created}, error: ${lastErr ? lastErr.slice(0, 40) : "ninguno"})`, created <= 20);

// 10) cuota de IA: límite exacto
const uidQ = XE;
let allowedCount = 0;
for (let i = 0; i < 102; i++) {
  const r = (await auth(uidQ, `select public.consume_ai_quota() q`))[0].q;
  if (r) allowedCount++; else break;
}
ok(`cuota IA para en <=100 (pasaron ${allowedCount})`, allowedCount <= 100);

// 11) accept_invitation siendo ya miembro con otro rol (no escala)
const inv = (await auth(O, `select public.create_invitation($1,'vu@x.com','admin') t`, [ag]))[0].t;
await auth(VU, `select public.accept_invitation($1)`, [inv]);
const rolVu = (await auth(VU, `select public.member_role($1) r`, [ag]))[0].r;
ok("invitación admin no escala a quien ya es viewer", rolVu === "viewer", rolVu);

// 12) link de invitación reutilizable tras entrar uno (por diseño) y tras remove_member se revoca
const link = (await auth(O, `select public.create_invite_link($1,'viewer') t`, [ag]))[0].t;
await auth(XE, `select public.accept_invitation($1)`, [link]);
ok("link abierto entra (por diseño)", (await auth(XE, `select public.member_role($1) r`, [ag]))[0].r === "viewer");
await auth(O, `select public.remove_member($1,$2)`, [ag, XE]);
ok("remove_member saca al miembro", (await auth(XE, `select public.member_role($1) r`, [ag]))[0].r === null);
let reenter = "error";
try { reenter = (await auth(XE, `select public.accept_invitation($1) a`, [link]))[0].a; } catch (e) { reenter = e.message.slice(0, 40); }
ok("link abierto revocado tras remove_member (email null)", reenter !== ag, String(reenter));
// pero una invitación con correo NO se revoca al expulsar:
const inv2 = (await auth(O, `select public.create_invitation($1,'xe@x.com','viewer') t`, [ag]))[0].t;
await auth(XE, `select public.accept_invitation($1)`, [inv2]); // entra
await auth(O, `select public.remove_member($1,$2)`, [ag, XE]); // lo expulsan
// ¿puede volver? invitación ya usada (accepted_at) → no
let back = "error";
try { back = (await auth(XE, `select public.accept_invitation($1) a`, [inv2]))[0].a; } catch (e) { back = e.message.slice(0, 40); }
ok("invitación por correo usada no reentra tras expulsión", back !== ag, String(back));
// ¿y una invitación por correo PENDIENTE sobrevive a remove_member?
const inv3 = (await auth(O, `select public.create_invitation($1,'ed@x.com','viewer') t`, [ag]))[0].t;
await auth(O, `select public.remove_member($1,$2)`, [ag, ED]); // expulsa al editor (sin usar inv3)
let edBack = "error";
try { edBack = (await auth(ED, `select public.accept_invitation($1) a`, [inv3]))[0].a; } catch (e) { edBack = e.message.slice(0, 40); }
ok("HALLAZGO si vuelve: invitación por correo pendiente permite volver tras expulsión", edBack === ag ? true : false, String(edBack));
if (edBack === ag) {
  const rolEd = (await auth(ED, `select public.member_role($1) r`, [ag]))[0].r;
  console.log(`   -> el editor expulsado volvió con rol: ${rolEd}`);
}

console.log(`\n${pass} ok, ${fail} hallazgos`);
process.exit(0);
