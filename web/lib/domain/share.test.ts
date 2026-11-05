import assert from "node:assert/strict";
import { test } from "node:test";
import type { BrandWorkspace, SocialPost } from "../types";
import {
  countSharePosts,
  resolveSharePostState,
  safeShareComments,
  safeShareNetworks,
  selectShareBrand,
  selectSharePosts,
} from "./share";

const post = (over: Partial<SocialPost>): SocialPost => ({ id: "p-1", brandId: "b-1", status: "pending", ...over }) as SocialPost;

const brand = (over: Partial<BrandWorkspace>): BrandWorkspace => ({ id: "b-1", name: "Café Bruma", shareToken: "cafe-bruma-nov", ...over }) as BrandWorkspace;

test("resolveSharePostState agrupa los estados que el cliente ve como aprobados", () => {
  assert.equal(resolveSharePostState(post({ status: "approved" })), "approved");
  assert.equal(resolveSharePostState(post({ status: "scheduled" })), "approved");
  assert.equal(resolveSharePostState(post({ status: "published" })), "approved");
  assert.equal(resolveSharePostState(post({ status: "changes" })), "changes");
  assert.equal(resolveSharePostState(post({ status: "pending" })), "pending");
  assert.equal(resolveSharePostState(post({ status: "draft" })), "pending");
});

test("countSharePosts separa listos de pendientes e incluye los cambios en pendientes", () => {
  assert.deepEqual(
    countSharePosts([
      post({ status: "approved" }),
      post({ status: "published" }),
      post({ status: "changes" }),
      post({ status: "pending" }),
      post({ status: "draft" }),
    ]),
    { approved: 2, pending: 3 },
  );
  assert.deepEqual(countSharePosts([]), { approved: 0, pending: 0 });
});

test("safeShareNetworks tolera un documento sin lista de redes", () => {
  assert.deepEqual(safeShareNetworks(post({ networks: ["Instagram", "LinkedIn"] })), ["Instagram", "LinkedIn"]);
  assert.deepEqual(safeShareNetworks(post({ networks: undefined as unknown as SocialPost["networks"] })), []);
});

test("safeShareComments descarta lo que no tiene forma de comentario", () => {
  const comments = [
    { id: "c-1", author: "Jair", role: "client", text: "Bien", createdAt: "2026-11-01" },
    { id: 2, author: "Roto" },
    null,
    "texto",
  ];
  assert.deepEqual(
    safeShareComments(post({ comments: comments as unknown as SocialPost["comments"] })),
    [{ id: "c-1", author: "Jair", role: "client", text: "Bien", createdAt: "2026-11-01" }],
  );
  assert.deepEqual(safeShareComments(post({ comments: undefined as unknown as SocialPost["comments"] })), []);
});

test("selectShareBrand usa la marca del servidor con cuentas y el token en la demo", () => {
  const demo = [brand({ id: "b-1", shareToken: "cafe-bruma-nov" }), brand({ id: "b-2", shareToken: "min-nov" })];
  assert.equal(selectShareBrand({ hasBackend: true, liveBrand: brand({ id: "live" }), demoBrands: demo, token: "no-existe" })?.id, "live");
  assert.equal(selectShareBrand({ hasBackend: true, liveBrand: null, demoBrands: demo, token: "cafe-bruma-nov" }), null);
  assert.equal(selectShareBrand({ hasBackend: false, liveBrand: brand({ id: "live" }), demoBrands: demo, token: "min-nov" })?.id, "b-2");
  assert.equal(selectShareBrand({ hasBackend: false, liveBrand: null, demoBrands: demo, token: "otro" }), null);
});

test("selectSharePosts deja solo los posts de la marca", () => {
  const posts = [post({ id: "1", brandId: "b-1" }), post({ id: "2", brandId: "b-2" }), post({ id: "3", brandId: "b-1" })];
  assert.deepEqual(
    selectSharePosts(posts, "b-1").map((p) => p.id),
    ["1", "3"],
  );
});
