import assert from "node:assert/strict";
import { test } from "node:test";
import { addCollaborators, availableFormats, bestHours, isPastSchedule, nextWeekday, normalizeFormat, repeatDates, videoLimit } from "./composer-rules";

test("colaboradores: limpia, valida, evita duplicados y respeta el tope", () => {
  assert.deepEqual(addCollaborators("@uno", []), { list: ["uno"], error: null });
  assert.deepEqual(addCollaborators("https://www.instagram.com/cafe.bruma/?hl=es", []).list, ["cafe.bruma"]);
  assert.deepEqual(addCollaborators("UNO dos", ["uno"]).list, ["uno", "dos"]);
  assert.match(addCollaborators("no-valido!", []).error ?? "", /no parece/);
  const lleno = addCollaborators("cuatro", ["a", "b", "c"]);
  assert.deepEqual(lleno.list, ["a", "b", "c"]);
  assert.match(lleno.error ?? "", /Máximo 3/);
});

test("formatos: se filtran por red y por archivo, y se corrigen solos", () => {
  assert.deepEqual(availableFormats(["Instagram"], [{ kind: "image" }]), ["Imagen", "Carrusel", "Story"]);
  assert.ok(!availableFormats(["Instagram"], [{ kind: "video" }]).includes("Imagen"));
  assert.ok(availableFormats(["Facebook"], [{ kind: "image" }]).includes("Texto"));
  assert.equal(normalizeFormat("Imagen", [{ kind: "video" }]), "Reel / Video");
  assert.equal(normalizeFormat("Imagen", [{ kind: "image" }, { kind: "image" }]), "Carrusel");
  assert.equal(normalizeFormat("Reel / Video", [{ kind: "image" }]), "Imagen");
  assert.equal(normalizeFormat("Story", [{ kind: "image" }]), "Story");
});

test("repetir story: siguientes fechas, fin y tope", () => {
  // 2 de noviembre de 2026 es lunes.
  assert.deepEqual(repeatDates({ days: [1] }, "2026-11-02").slice(0, 2), ["2026-11-09", "2026-11-16"]);
  assert.deepEqual(repeatDates({ days: [1], endDate: "2026-11-10" }, "2026-11-02"), ["2026-11-09"]);
  assert.equal(repeatDates({ days: [0, 1, 2, 3, 4, 5, 6] }, "2026-11-02").length, 12);
  assert.deepEqual(repeatDates({ days: [] }, "2026-11-02"), []);
});

test("mejores horas: promedia solo publicados con alcance y hora", () => {
  const base = { status: "published" as const, scheduledDate: "2026-11-02", scheduledTime: "09:00" };
  const metrics = (reach: number) => ({ reach, likes: 0, comments: 0, saves: 0, shares: 0 });
  const horas = bestHours([
    { ...base, metrics: metrics(100) },
    { ...base, metrics: metrics(300) },
    { ...base, scheduledTime: "18:30", metrics: metrics(900) },
    { ...base, status: "draft", metrics: metrics(5000) },
    { ...base, scheduledTime: "", metrics: metrics(5000) },
  ]);
  assert.deepEqual(horas.map((h) => [h.dayName, h.hour, h.average, h.pieces]), [["Lun", 18, 900, 1], ["Lun", 9, 200, 2]]);
});

test("fechas y límites", () => {
  assert.equal(nextWeekday("2026-11-02", 1), "2026-11-02");
  assert.equal(nextWeekday("2026-11-03", 1), "2026-11-09");
  const ahora = new Date("2026-11-02T12:00:00");
  assert.equal(isPastSchedule("2026-11-02", "09:00", ahora), true);
  assert.equal(isPastSchedule("2026-11-02", "15:00", ahora), false);
  assert.equal(videoLimit("Instagram", "Reel / Video")?.seconds, 180);
  assert.equal(videoLimit("Pinterest", "Reel / Video"), null);
});
