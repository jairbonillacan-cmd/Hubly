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
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text);
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[:cardinality(string_to_array(name, '/')) - 1] $$;
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant execute on function storage.foldername(text) to anon, authenticated;
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
const link = (await as(A, "authenticated", `select public.create_invite_link($1,'viewer') t`, [ag]))[0].t;
ok("link sin correo en la vista previa", (await as(null, "anon", `select public.invitation_preview($1) p`, [link]))[0].p.email === null);
await errs("link no admite rol de administración", () => as(A, "authenticated", `select public.create_invite_link($1,'admin')`, [ag]), "invalid_role");
await errs("editor no crea links", () => as(D, "authenticated", `select public.create_invite_link($1,'viewer')`, [ag]), "forbidden");
await errs("correo sin verificar no entra por link", () => as(C, "authenticated", `select public.accept_invitation($1)`, [link]), "email_mismatch");
ok("correo verificado entra por link", (await as(B, "authenticated", `select public.accept_invitation($1) a`, [link]))[0].a === ag);
ok("el link entra con su rol", (await as(B, "authenticated", `select public.member_role($1) r`, [ag]))[0].r === "viewer");
ok("el link no cambia el rol de quien ya es miembro", (await as(D, "authenticated", `select public.accept_invitation($1) a`, [link]))[0].a === ag && (await as(D, "authenticated", `select public.member_role($1) r`, [ag]))[0].r === "editor");
const linkId = (await as(A, "authenticated", `select id from public.agency_invitations where email is null`))[0].id;
await as(A, "authenticated", `select public.revoke_invitation($1)`, [linkId]);
await errs("link revocado no sirve", () => as(C, "authenticated", `select public.accept_invitation($1)`, [link]), "invalid_invitation");
await as(A, "authenticated", `select public.remove_member($1,$2)`, [ag, B]);
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
// Chat: aislamiento por agencia, mensajes directos privados y autoría.
{
  const uuid = (n) => `${String(n).repeat(8)}-0000-4000-8000-${String(n).repeat(12)}`;
  const canal = (await as(A, "authenticated", `insert into public.chat_channels (agency_id, kind, name, unique_key) values ($1,'general','General','general') returning id`, [ag]))[0].id;
  const msg = (id, canalId, agencia, texto = "hola") => [`insert into public.chat_messages (id, channel_id, agency_id, sender_name, sender_initials, text) values ($1,$2,$3,'Ana','AN',$4)`, [id, canalId, agencia, texto]];
  await as(A, "authenticated", ...msg(uuid(1), canal, ag));
  ok("chat: el miembro lee su mensaje", (await as(A, "authenticated", `select * from public.chat_messages`)).length === 1);
  ok("chat: otra agencia no ve el canal", (await as(B, "authenticated", `select * from public.chat_channels where id=$1`, [canal])).length === 0);
  ok("chat: otra agencia no ve mensajes", (await as(B, "authenticated", `select * from public.chat_messages`)).length === 0);
  await errs("chat: otra agencia no escribe", () => as(B, "authenticated", ...msg(uuid(2), canal, ag)), "row-level");
  await errs("chat: anon no lee", () => as(null, "anon", `select * from public.chat_messages`), "permission");
  await errs("chat: no se finge autor", () => as(A, "authenticated", `insert into public.chat_messages (id, channel_id, agency_id, user_id, sender_name, sender_initials, text) values ($1,$2,$3,$4,'B','B','x')`, [uuid(3), canal, ag, B]), "row-level");
  await errs("chat: no se mueve a otro canal", () => as(A, "authenticated", `update public.chat_messages set channel_id=$1`, [canal]), "permission");
  await errs("chat: mensaje vacío rechazado", () => as(A, "authenticated", ...msg(uuid(4), canal, ag, "")), "check");

  await db.query(`insert into public.agency_members (agency_id, user_id, role) values ($1,$2,'editor'), ($1,$3,'editor') on conflict (agency_id, user_id) do update set role = 'editor'`, [ag, B, D]);
  const directo = (await as(A, "authenticated", `insert into public.chat_channels (agency_id, kind, name, unique_key, member_ids) values ($1,'direct','Dos','d',$2) returning id`, [ag, [A, B]]))[0].id;
  await as(A, "authenticated", ...msg(uuid(5), directo, ag, "privado"));
  ok("chat: el otro participante lee el directo", (await as(B, "authenticated", `select * from public.chat_messages where channel_id=$1`, [directo])).length === 1);
  ok("chat: un tercero no ve el directo", (await as(D, "authenticated", `select * from public.chat_messages where channel_id=$1`, [directo])).length === 0);
  ok("chat: un tercero no ve que existe", (await as(D, "authenticated", `select * from public.chat_channels where id=$1`, [directo])).length === 0);
  await errs("chat: no se crea directo ajeno", () => as(D, "authenticated", `insert into public.chat_channels (agency_id, kind, name, unique_key, member_ids) values ($1,'direct','X','x',$2)`, [ag, [A, B]]), "row-level");

  await as(B, "authenticated", `update public.chat_messages set text='cambiado' where id=$1`, [uuid(1)]);
  ok("chat: no se edita lo ajeno", (await as(A, "authenticated", `select text from public.chat_messages where id=$1`, [uuid(1)]))[0].text === "hola");
  await as(B, "authenticated", `select public.chat_set_pinned($1, true)`, [uuid(1)]);
  ok("chat: cualquier miembro fija", (await as(A, "authenticated", `select pinned from public.chat_messages where id=$1`, [uuid(1)]))[0].pinned === true);
  await errs("chat: no fija un directo que no ve", () => as(D, "authenticated", `select public.chat_set_pinned($1, true)`, [uuid(5)]), "forbidden");

  await as(B, "authenticated", `insert into public.chat_reactions (message_id, agency_id, user_name, emoji) values ($1,$2,'Beto','🔥')`, [uuid(1), ag]);
  await errs("chat: no reacciona en un directo que no ve", () => as(D, "authenticated", `insert into public.chat_reactions (message_id, agency_id, user_name, emoji) values ($1,$2,'D','🔥')`, [uuid(5), ag]), "row-level");
  await as(A, "authenticated", `delete from public.chat_reactions where message_id=$1`, [uuid(1)]);
  ok("chat: no se borra la reacción ajena", (await as(B, "authenticated", `select * from public.chat_reactions`)).length === 1);

  await as(A, "authenticated", `insert into public.chat_preferences (channel_id, muted) values ($1,true)`, [canal]);
  ok("chat: las preferencias son de cada quien", (await as(B, "authenticated", `select * from public.chat_preferences`)).length === 0);
  await as(A, "authenticated", `insert into public.chat_scheduled (channel_id, sender_name, sender_initials, text, send_at, repeat) values ($1,'Ana','AN','luego',now() - interval '1 minute','weekly')`, [canal]);
  ok("chat: lo programado es privado", (await as(B, "authenticated", `select * from public.chat_scheduled`)).length === 0);

  await as(B, "authenticated", `select public.chat_flush_due()`);
  await as(B, "authenticated", `select public.chat_flush_due()`);
  ok("chat: lo programado sale una vez, aunque lo dispare otro", (await as(A, "authenticated", `select * from public.chat_messages where text='luego'`)).length === 1);
  ok("chat: la serie pasa a su siguiente fecha", (await as(A, "authenticated", `select send_at > now() f from public.chat_scheduled`))[0].f === true);

  const privado = (await as(A, "authenticated", `insert into public.chat_channels (agency_id, kind, name, member_ids) values ($1,'agency','Privado',$2) returning id`, [ag, [A, B]]))[0].id;
  ok("chat: un miembro ve el canal privado", (await as(B, "authenticated", `select * from public.chat_channels where id=$1`, [privado])).length === 1);
  ok("chat: quien no es miembro no lo ve", (await as(D, "authenticated", `select * from public.chat_channels where id=$1`, [privado])).length === 0);
  await errs("chat: quien no es miembro no escribe", () => as(D, "authenticated", ...msg(uuid(6), privado, ag)), "row-level");

  const token = (await as(A, "authenticated", `select public.chat_create_bot($1,'Ventas') t`, [canal]))[0].t;
  await as(null, "anon", `select public.chat_bot_post($1,'venta nueva')`, [token]);
  const delBot = await as(A, "authenticated", `select * from public.chat_messages where text='venta nueva'`);
  ok("chat: el bot publica con su token", delBot.length === 1 && delBot[0].sender_name === "Ventas");
  await errs("chat: token inválido rechazado", () => as(null, "anon", `select public.chat_bot_post('x','y')`), "invalid_token");
  await errs("chat: no se lee el hash del token", () => as(A, "authenticated", `select token_hash from public.chat_bots`), "permission");
  await errs("chat: otra agencia no crea bots aquí", async () => { await db.query(`delete from public.agency_members where agency_id=$1 and user_id=$2`, [ag, D]); await as(D, "authenticated", `select public.chat_create_bot($1,'x')`, [canal]); }, "forbidden");
  await db.query(`insert into public.agency_members (agency_id, user_id, role) values ($1,$2,'editor')`, [ag, D]);
  await db.query(`insert into public.chat_messages (id, channel_id, agency_id, user_id, bot_id, sender_name, sender_initials, text) select gen_random_uuid(), channel_id, agency_id, id, id, name, 'V', 'x' from public.chat_bots, generate_series(1,30)`);
  await errs("chat: el bot tiene límite por minuto", () => as(null, "anon", `select public.chat_bot_post($1,'otra')`, [token]), "rate_limited");

  // 0009: avisos, viendo, eventos firmados.
  await db.query(`update auth.users set raw_user_meta_data='{"name":"Beto Luna"}' where id=$1`, [B]);
  await as(A, "authenticated", ...msg(uuid(7), canal, ag, "oye @beto luna"));
  ok("chat: la mención crea un aviso", (await as(B, "authenticated", `select * from public.chat_notifications`)).length === 1);
  ok("chat: el aviso es privado", (await as(A, "authenticated", `select * from public.chat_notifications`)).length === 0);
  await as(B, "authenticated", `insert into public.chat_preferences (channel_id, viewing_at) values ($1, now()) on conflict (channel_id, user_id) do update set viewing_at = now()`, [canal]);
  await as(A, "authenticated", ...msg(uuid(8), canal, ag, "otra vez @beto luna"));
  ok("chat: si lo está viendo no se avisa", (await as(B, "authenticated", `select * from public.chat_notifications`)).length === 1);
  await as(A, "authenticated", `insert into public.chat_reminders (channel_id, message_id, text, remind_at) values ($1,$2,'revisar',now() - interval '1 minute')`, [canal, uuid(7)]);
  await as(B, "authenticated", `select public.chat_flush_due()`);
  ok("chat: el recordatorio llega aunque lo dispare otro", (await as(A, "authenticated", `select title from public.chat_notifications`)).some((n) => n.title === "Recordatorio del chat"));
  const bot = (await as(A, "authenticated", `select id from public.chat_bots limit 1`))[0].id;
  const secreto = (await as(A, "authenticated", `select public.chat_configure_bot($1,'https://ejemplo.test/x',array['canal','boton']) s`, [bot]))[0].s;
  await errs("chat: otro no configura el bot", () => as(B, "authenticated", `select public.chat_configure_bot($1,'https://mala.test',array['canal'])`, [bot]), "forbidden");
  await errs("chat: no se lee el secreto", () => as(A, "authenticated", `select events_secret from public.chat_bots`), "permission");
  const entrega = (await as(A, "authenticated", `select * from public.chat_bot_deliveries($1)`, [uuid(8)]))[0];
  const { createHmac } = await import("node:crypto");
  ok("chat: la firma es un HMAC-SHA256 verificable", entrega.signature === createHmac("sha256", secreto).update(entrega.payload).digest("hex"), entrega.signature);
  await errs("chat: no se pide entrega de mensaje ajeno", () => as(B, "authenticated", `select * from public.chat_bot_deliveries($1)`, [uuid(8)]), "forbidden");
  await errs("chat: anon no pide entregas", () => as(null, "anon", `select * from public.chat_bot_deliveries($1)`, [uuid(8)]), "permission");

  await as(B, "authenticated", `delete from public.chat_messages where id=$1`, [uuid(1)]);
  ok("chat: un editor no borra lo ajeno", (await as(A, "authenticated", `select * from public.chat_messages where id=$1`, [uuid(1)])).length === 1);
  await errs("chat: el canal general no se borra", async () => {
    const r = await as(A, "authenticated", `delete from public.chat_channels where id=$1 returning id`, [canal]);
    if (r.length === 0) throw new Error("row-level: sin filas");
  }, "row-level");
}
console.log(`\n${pass} ok, ${fail} fallos`);
process.exit(fail ? 1 : 0);
