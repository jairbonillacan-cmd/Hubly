import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  grant usage on schema auth, public to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`);
await db.exec(fs.readFileSync(new URL("../../supabase/migrations/0001_agencias_y_espacios.sql", import.meta.url), "utf8"));
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
console.log(`\n${pass} ok, ${fail} fallos`);
process.exit(fail ? 1 : 0);
