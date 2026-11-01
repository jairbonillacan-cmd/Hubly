import test from "node:test";
import assert from "node:assert/strict";
import {
  safeFileName,
  mediaRejection,
  validateMediaMagicBytes,
  MAX_IMAGE_BYTES,
  MAX_VIDEO_BYTES,
  MAX_DOCUMENT_BYTES,
} from "../lib/media";
import { POST as workspacePost } from "../app/api/workspace/route";
import { POST as waitlistPost } from "../app/api/waitlist/route";
import { POST as aiCaptionPost } from "../app/api/ai/caption/route";
import { PUT as mediaPut } from "../app/api/media/[id]/file/route";
import { DELETE as mediaDelete } from "../app/api/media/[id]/route";
import { demoCreate } from "../lib/media-demo-store";

test("seguridad: safeFileName bloquea recorrido de rutas (path traversal)", () => {
  assert.equal(safeFileName(".."), "archivo");
  assert.equal(safeFileName("."), "archivo");
  assert.equal(safeFileName("../.."), "archivo");
  assert.equal(safeFileName("../../../etc/passwd"), "etc-passwd");
  assert.equal(safeFileName(".oculto"), "oculto");
  assert.equal(safeFileName("doble..punto.png"), "doble-punto.png");
  assert.equal(safeFileName("foto.png"), "foto.png");
  assert.equal(safeFileName("marca-123"), "marca-123");
});

test("seguridad: mediaRejection valida tamaños finitos positivos y límites por tipo", () => {
  assert.equal(mediaRejection("image/png", NaN), "El archivo está vacío.");
  assert.equal(mediaRejection("image/png", -10), "El archivo está vacío.");
  assert.equal(mediaRejection("image/png", 0), "El archivo está vacío.");
  assert.equal(mediaRejection("image/png", Infinity), "El archivo está vacío.");
  assert.equal(mediaRejection("image/png", MAX_IMAGE_BYTES), null);
  assert.ok(mediaRejection("image/png", MAX_IMAGE_BYTES + 1));
  assert.equal(mediaRejection("video/mp4", MAX_VIDEO_BYTES), null);
  assert.ok(mediaRejection("video/mp4", MAX_VIDEO_BYTES + 1));
  assert.equal(mediaRejection("application/pdf", MAX_DOCUMENT_BYTES), null);
  assert.ok(mediaRejection("application/pdf", MAX_DOCUMENT_BYTES + 1));
});

test("seguridad: validateMediaMagicBytes comprueba el tipo real frente al declarado", () => {
  const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
  const gifHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
  const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
  const textHtml = new TextEncoder().encode("<script>alert('xss')</script>");

  assert.equal(validateMediaMagicBytes(pngHeader, "image/png"), true);
  assert.equal(validateMediaMagicBytes(textHtml, "image/png"), false);
  assert.equal(validateMediaMagicBytes(jpegHeader, "image/jpeg"), true);
  assert.equal(validateMediaMagicBytes(pngHeader, "image/jpeg"), false);
  assert.equal(validateMediaMagicBytes(gifHeader, "image/gif"), true);
  assert.equal(validateMediaMagicBytes(pdfHeader, "application/pdf"), true);
  assert.equal(validateMediaMagicBytes(textHtml, "application/pdf"), false);
});

test("seguridad: POST /api/workspace responde 400 ante JSON inválido en vez de 500", async () => {
  const req = new Request("http://localhost:3022/api/workspace", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "este no es un json valido",
  });
  const res = await workspacePost(req);
  assert.equal(res.status, 400);
  const json = await res.json();
  assert.equal(json.error, "invalid_payload");
});

test("seguridad: POST /api/workspace responde 413 ante cuerpo excesivo", async () => {
  const req = new Request("http://localhost:3022/api/workspace", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "content-length": String(9 * 1024 * 1024),
    },
    body: JSON.stringify({ brands: [], posts: [] }),
  });
  const res = await workspacePost(req);
  assert.equal(res.status, 413);
  const json = await res.json();
  assert.equal(json.error, "too_large");
});

test("seguridad: POST /api/waitlist limita tamaño del cuerpo a 16 KB", async () => {
  const req = new Request("http://localhost:3022/api/waitlist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "content-length": "20000",
    },
    body: JSON.stringify({ email: "test@example.com" }),
  });
  const res = await waitlistPost(req);
  assert.equal(res.status, 413);
  const json = await res.json();
  assert.equal(json.error, "too_large");
});

test("seguridad: POST /api/ai/caption limita tamaño del cuerpo a 64 KB", async () => {
  const req = new Request("http://localhost:3022/api/ai/caption", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "content-length": "70000",
    },
    body: JSON.stringify({ brief: "Hola" }),
  });
  const res = await aiCaptionPost(req);
  assert.equal(res.status, 413);
  const json = await res.json();
  assert.equal(json.error, "too_large");
});

test("seguridad: DELETE /api/media/[id] devuelve 404 si el archivo no existe", async () => {
  const req = new Request("http://localhost:3022/api/media/00000000-0000-0000-0000-000000000000", {
    method: "DELETE",
  });
  const res = await mediaDelete(req, {
    params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
  });
  assert.equal(res.status, 404);
  const json = await res.json();
  assert.equal(json.error, "not_found");
});

test("seguridad: PUT /api/media/[id]/file rechaza bytes que no coinciden con MIME declarado", async () => {
  const record = await demoCreate({
    brandId: "brand-test",
    folder: "",
    name: "falso.png",
    kind: "image",
    mime: "image/png",
    sizeBytes: 15,
  });

  const req = new Request(`http://localhost:3022/api/media/${record.id}/file`, {
    method: "PUT",
    headers: { "Content-Type": "image/png" },
    body: new TextEncoder().encode("no-es-png-bytes"), // 15 bytes de texto plano
  });

  const res = await mediaPut(req, {
    params: Promise.resolve({ id: record.id }),
  });
  assert.equal(res.status, 422);
  const json = await res.json();
  assert.equal(json.error, "mime_mismatch");
});
