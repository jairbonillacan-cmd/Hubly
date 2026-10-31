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
  -- Lo mínimo de Supabase Storage para aplicar y probar sus políticas.
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant select, insert, delete on storage.objects to anon, authenticated;
`);
const dir = new URL("../../supabase/migrations/", import.meta.url);
for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(new URL(f, dir), "utf8"));
const [A, B, C, D] = ["a", "b", "c", "d"].map((c) => `${c.repeat(8)}-${c.repeat(4)}-4${c.repeat(3)}-8${c.repeat(3)}-${c.repeat(12)}`);
await db.query(`insert into auth.users values ($1,'a@x.com',now()),($2,'b@x.com',now()),($3,'c@x.com',null),($4,'d@x.com',now())`, [A, B, C, D]);
async function as(uid, role, sql, params = []) {
  await db.exec(`reset role; select set_config('test.uid','${uid || ""}',false); set role ${role};`);
  try { return (await db.query(sql, params)).rows; } finally { await db.exec("reset role"); }
}
let pass = 0, fail = 0;
const ok = (name, cond, extra = "") => { cond ? pass++ : fail++; console.log(`${cond ? "ok  " : "FAIL"} ${name} ${cond ? "" : extra}`); };
const errs = async (name, fn, code) => {
  try { await fn(); ok(name, false, "no lanzó"); } catch (e) { ok(name, !code || e.message.includes(code), e.message); }
};
const ag = (await as(A, "authenticated", `select public.create_agency('Agencia A') id`))[0].id;
const agB = (await as(B, "authenticated", `select public.create_agency('Agencia B') id`))[0].id;
ok("dueño ve su agencia", (await as(A, "authenticated", `select * from public.agencies`)).length === 1);
ok("aislamiento: B no ve agencia A", (await as(B, "authenticated", `select * from public.agencies where id=$1`, [ag])).length === 0);
ok("aislamiento: B no lee doc de A", (await as(B, "authenticated", `select * from public.agency_workspaces where agency_id=$1`, [ag])).length === 0);
ok("aislamiento: anon no lee", await as(null, "anon", `select * from public.agencies`).then(() => false).catch(() => true));
await errs("B no escribe doc de A", () => as(B, "authenticated", `select public.save_workspace($1,'{}',1)`, [ag]), "forbidden");
await errs("no hay update directo", () => as(A, "authenticated", `update public.agency_workspaces set data='{}'`), "permission");
await errs("no se autoagrega", () => as(B, "authenticated", `insert into public.agency_members values ($1,$2,'owner')`, [ag, B]), "permission");
await errs("anon no crea agencia", () => as(null, "anon", `select public.create_agency('x')`), "permission");
const doc = { brands: [{ id: "b1", name: "Marca 1", handle: "@m1", initials: "M", color: "#000", secreto: "no" }, { id: "b2", name: "Otra" }],
  posts: [
    { id: "p1", brandId: "b1", title: "T1", status: "pending", notes: "INTERNA", chat: [1], comments: [] },
    { id: "p2", brandId: "b2", title: "AJENO", status: "pending", comments: [] },
    { id: "p3", brandId: "b1", title: "BORRADOR", status: "draft", comments: [] },
    { id: "p4", brandId: "b1", title: "PUB", status: "published", comments: [] },
  ], team: [{ email: "secreto@x" }] };
const v = (await as(A, "authenticated", `select public.save_workspace($1,$2,1) v`, [ag, doc]))[0].v;
ok("guardar sube versión", v === 2);
await errs("versión vieja rechazada", () => as(A, "authenticated", `select public.save_workspace($1,$2,1)`, [ag, doc]), "stale_version");
const inv = (await as(A, "authenticated", `select public.create_invitation($1,'D@x.com','viewer') t`, [ag]))[0].t;
await errs("otro correo no acepta", () => as(B, "authenticated", `select public.accept_invitation($1)`, [inv]), "email_mismatch");
const inv2 = (await as(A, "authenticated", `select public.create_invitation($1,'c@x.com','editor') t`, [ag]))[0].t;
await errs("correo sin verificar no acepta", () => as(C, "authenticated", `select public.accept_invitation($1)`, [inv2]), "email_mismatch");
ok("correo correcto acepta", (await as(D, "authenticated", `select public.accept_invitation($1) a`, [inv]))[0].a === ag);
await errs("invitación es de un solo uso", () => as(D, "authenticated", `select public.accept_invitation($1)`, [inv]), "invalid_invitation");
ok("invitado lee doc", (await as(D, "authenticated", `select * from public.agency_workspaces where agency_id=$1`, [ag])).length === 1);
await errs("lector no escribe", () => as(D, "authenticated", `select public.save_workspace($1,$2,2)`, [ag, doc]), "forbidden");
await errs("lector no crea enlaces", () => as(D, "authenticated", `select public.create_share_link($1,'b1')`, [ag]), "forbidden");
await errs("no se quita último dueño", () => as(A, "authenticated", `select public.remove_member($1,$2)`, [ag, A]), "last_owner");
await errs("lector no quita miembros", () => as(D, "authenticated", `select public.remove_member($1,$2)`, [ag, A]), "forbidden");
const tok = (await as(A, "authenticated", `select public.create_share_link($1,'b1') t`, [ag]))[0].t;
ok("token guardado como hash", (await as(A, "authenticated", `select token_hash from public.share_links`))[0].token_hash !== tok);
const portal = (await as(null, "anon", `select public.get_share_portal($1) p`, [tok]))[0].p;
const s = JSON.stringify(portal);
ok("portal: su marca", portal.brand.name === "Marca 1");
ok("portal: sin campos internos", !s.includes("INTERNA") && !s.includes("secreto") && !s.includes('"chat"'));
ok("portal: sin otra marca", !s.includes("AJENO"));
ok("portal: sin borradores", !s.includes("BORRADOR"));
ok("portal: token inválido nulo", (await as(null, "anon", `select public.get_share_portal('xxx') p`))[0].p === null);
ok("anon sin tabla directa", await as(null, "anon", `select * from public.agency_workspaces`).then(() => false).catch(() => true));
ok("decidir post ajeno falla", (await as(null, "anon", `select public.submit_share_decision($1,'p2','approved',null,'X') r`, [tok]))[0].r === false);
ok("decidir borrador falla", (await as(null, "anon", `select public.submit_share_decision($1,'p3','approved',null,'X') r`, [tok]))[0].r === false);
ok("publicado no se revierte", (await as(null, "anon", `select public.submit_share_decision($1,'p4','changes','x','X') r`, [tok]))[0].r === false);
await errs("cambios exigen comentario", () => as(null, "anon", `select public.submit_share_decision($1,'p1','changes','  ','X')`, [tok]), "comment_required");
await errs("decisión inválida", () => as(null, "anon", `select public.submit_share_decision($1,'p1','published',null,'X')`, [tok]), "invalid_decision");
ok("aprobar funciona", (await as(null, "anon", `select public.submit_share_decision($1,'p1','approved',null,'Cliente Ana') r`, [tok]))[0].r === true);
const after = (await db.query(`select data,version from public.agency_workspaces where agency_id=$1`, [ag])).rows[0];
const p1 = after.data.posts.find((p) => p.id === "p1");
ok("aprobación guardada y firmada", p1.status === "approved" && p1.comments[0].author === "Cliente Ana" && after.version === 3);
ok("resto intacto", after.data.posts.length === 4 && after.data.posts[0].notes === "INTERNA" && after.data.posts.find((p) => p.id === "p2").status === "pending");
await errs("dueño con versión vieja tras decisión", () => as(A, "authenticated", `select public.save_workspace($1,$2,2)`, [ag, doc]), "stale_version");
const lid = (await as(A, "authenticated", `select id from public.share_links limit 1`))[0].id;
await as(B, "authenticated", `select public.revoke_share_link($1)`, [lid]);
ok("otra agencia no revoca", (await as(null, "anon", `select public.get_share_portal($1) p`, [tok]))[0].p !== null);
await as(A, "authenticated", `select public.revoke_share_link($1)`, [lid]);
ok("revocado no abre", (await as(null, "anon", `select public.get_share_portal($1) p`, [tok]))[0].p === null);
ok("revocado no decide", (await as(null, "anon", `select public.submit_share_decision($1,'p1','approved',null,'X') r`, [tok]))[0].r === false);
await db.query(`update public.share_links set revoked_at=null, expires_at=now()-interval '1 day'`);
ok("caducado no abre", (await as(null, "anon", `select public.get_share_portal($1) p`, [tok]))[0].p === null);
const tokN = (await as(A, "authenticated", `select public.create_share_link($1,'b1') t`, [ag]))[0].t;
await db.query(`update public.agency_workspaces set data = jsonb_set(data,'{posts,0,status}','"pending"') where agency_id=$1`, [ag]);
await as(null, "anon", `select public.submit_share_decision($1,'p1','approved',null,'Lu')`, [tokN]);
const docN = (await db.query(`select data from public.agency_workspaces where agency_id=$1`, [ag])).rows[0].data;
ok("decisión crea notificación", docN.notifications?.[0]?.title === "Lu aprobó un post" && docN.notifications[0].body === "T1" && docN.notifications[0].read === false);

// Miembros e historial (0002)
ok("miembro lista el equipo", (await as(D, "authenticated", `select * from public.list_members($1)`, [ag])).length === 2);
await errs("ajeno no lista el equipo", () => as(B, "authenticated", `select * from public.list_members($1)`, [ag]), "forbidden");
await errs("anon no lista el equipo", () => as(null, "anon", `select * from public.list_members($1)`, [ag]), "permission");
await errs("lector no cambia roles", () => as(D, "authenticated", `select public.update_member_role($1,$2,'owner')`, [ag, D]), "forbidden");
await errs("no degradar último dueño", () => as(A, "authenticated", `select public.update_member_role($1,$2,'viewer')`, [ag, A]), "last_owner");
await as(A, "authenticated", `select public.update_member_role($1,$2,'editor')`, [ag, D]);
ok("dueño cambia rol", (await as(D, "authenticated", `select public.member_role($1) r`, [ag]))[0].r === "editor");
const inv3 = (await as(A, "authenticated", `select public.create_invitation($1,'b@x.com','viewer') t`, [ag]))[0].t;
ok("vista previa sin sesión", (await as(null, "anon", `select public.invitation_preview($1) p`, [inv3]))[0].p.agency === "Agencia A");
ok("vista previa token malo", (await as(null, "anon", `select public.invitation_preview('zzz') p`))[0].p === null);
const iid = (await as(A, "authenticated", `select id from public.agency_invitations where email='b@x.com'`))[0].id;
await as(D, "authenticated", `select public.revoke_invitation($1)`, [iid]);
ok("editor no revoca invitación", (await as(null, "anon", `select public.invitation_preview($1) p`, [inv3]))[0].p !== null);
await as(A, "authenticated", `select public.revoke_invitation($1)`, [iid]);
await errs("invitación revocada no sirve", () => as(B, "authenticated", `select public.accept_invitation($1)`, [inv3]), "invalid_invitation");
const tok2 = (await as(A, "authenticated", `select public.create_share_link($1,'b1') t`, [ag]))[0].t;
await db.query(`update public.agency_workspaces set data = jsonb_set(data,'{posts,0,status}','"pending"') where agency_id=$1`, [ag]);
ok("decisión con actividad", (await as(null, "anon", `select public.submit_share_decision($1,'p1','changes','Cambia la foto','Ana') r`, [tok2]))[0].r === true);
const p1b = (await db.query(`select data from public.agency_workspaces where agency_id=$1`, [ag])).rows[0].data.posts.find((p) => p.id === "p1");
ok("actividad registra firma sin cuenta", p1b.activity[0].author.includes("Ana") && p1b.activity[0].author.includes("sin cuenta") && p1b.status === "changes");
ok("otra agencia intacta", (await db.query(`select version from public.agency_workspaces where agency_id=$1`, [agB])).rows[0].version === 1);

// Archivos: la ruta manda la agencia, y el portal solo abre medios de posts que muestra.
{
  const asA = (sql, params) => as(A, "authenticated", sql, params);
  const [agencyM, agencyN] = [
    (await asA(`select public.create_agency('Medios') id`))[0].id,
    (await as(B, "authenticated", `select public.create_agency('Otra medios') id`))[0].id,
  ];
  const path = `${agencyM}/b1/foto.png`;
  const oculto = `${agencyM}/b1/oculto.png`;
  const insertAsset = `insert into public.media_assets (agency_id, brand_id, name, kind, mime, size_bytes, path, status) values ($1,'b1',$2,'image','image/png',10,$3,'ready') returning id`;
  const asset = (await asA(insertAsset, [agencyM, "foto.png", path]))[0].id;
  const assetOculto = (await asA(insertAsset, [agencyM, "oculto.png", oculto]))[0].id;
  await errs("otra agencia no registra archivos", () => as(B, "authenticated", insertAsset, [agencyM, "x.png", `${agencyM}/b1/x.png`]), "row-level");
  ok("otra agencia no ve archivos", (await as(B, "authenticated", `select * from public.media_assets where agency_id=$1`, [agencyM])).length === 0);
  await asA(`insert into storage.objects (bucket_id, name) values ('media',$1),('media',$2)`, [path, oculto]);
  await errs("otra agencia no sube a su ruta", () => as(B, "authenticated", `insert into storage.objects (bucket_id, name) values ('media',$1)`, [`${agencyM}/b1/intruso.png`]), "row-level");
  await as(B, "authenticated", `insert into storage.objects (bucket_id, name) values ('media',$1)`, [`${agencyN}/b1/propio.png`]);
  ok("miembro lee sus archivos", (await asA(`select * from storage.objects where name=$1`, [path])).length === 1);
  ok("otra agencia no lee el archivo", (await as(B, "authenticated", `select * from storage.objects where name=$1`, [path])).length === 0);
  ok("anon sin token no lee el archivo", (await as(null, "anon", `select * from storage.objects where name=$1`, [path])).length === 0);
  await db.query(`update public.agency_workspaces set data=$2 where agency_id=$1`, [agencyM, JSON.stringify({
    brands: [{ id: "b1", name: "Marca" }],
    posts: [
      { id: "m1", brandId: "b1", title: "Con medio", status: "pending", comments: [], notes: "INTERNA", media: [{ id: "x", assetId: asset, kind: "image", name: "foto.png" }], platformSettings: { Pinterest: { caption: "pin", boardName: "SECRETO" } } },
      { id: "m2", brandId: "b1", title: "Borrador", status: "draft", comments: [], media: [{ id: "y", assetId: assetOculto, kind: "image", name: "oculto.png" }] },
    ],
  })]);
  const token = (await asA(`select public.create_share_link($1,'b1') t`, [agencyM]))[0].t;
  const rawToken = typeof token === "string" ? token : token?.token;
  const conToken = async (name, t) => {
    await db.exec(`reset role; select set_config('test.uid','',false); select set_config('request.headers', '${JSON.stringify({ "x-hubly-share-token": t })}', false); set role anon;`);
    try { return (await db.query(`select * from storage.objects where name=$1`, [name])).rows; }
    finally { await db.exec(`reset role; select set_config('request.headers','',false)`); }
  };
  ok("el portal abre un medio de su post", (await conToken(path, rawToken)).length === 1);
  ok("el portal no abre medios de borradores", (await conToken(oculto, rawToken)).length === 0);
  ok("un token falso no abre medios", (await conToken(path, "falso")).length === 0);
  ok("el portal traduce un medio compartido", (await as(null, "anon", `select public.share_media_path($1,$2) p`, [rawToken, asset]))[0].p === path);
  ok("el portal no traduce medios de borradores", (await as(null, "anon", `select public.share_media_path($1,$2) p`, [rawToken, assetOculto]))[0].p === null);
  const portal = (await as(null, "anon", `select public.get_share_portal($1) p`, [rawToken]))[0].p;
  const visto = portal.posts.find((p) => p.id === "m1");
  ok("el portal recibe el medio", visto?.media?.[0]?.assetId === asset);
  ok("el portal recibe el copy por red", visto?.platformCaptions?.Pinterest === "pin");
  ok("el portal no recibe ajustes internos", !JSON.stringify(portal).includes("SECRETO") && !JSON.stringify(portal).includes("INTERNA"));
  ok("el portal no recibe borradores", !portal.posts.some((p) => p.id === "m2"));
  await as(null, "anon", `select public.submit_share_decision($1,'m1','approved','','Cliente')`, [rawToken]);
  const tras = (await db.query(`select data from public.agency_workspaces where agency_id=$1`, [agencyM])).rows[0].data;
  ok("aprobar en el portal etiqueta Aprobado", tras.posts.find((p) => p.id === "m1").statusLabel === "Aprobado");
}
console.log(`\n${pass} ok, ${fail} fallos`);
process.exit(fail ? 1 : 0);
