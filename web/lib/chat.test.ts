import assert from "node:assert/strict";
import { test } from "node:test";
import {
  channelRoots,
  continuesPrevious,
  dayLabel,
  groupByDay,
  initialsOf,
  matchesQuery,
  replyCounts,
  toggleReaction,
} from "@/lib/chat";
import type { ChatMessage } from "@/lib/types";

const at = (iso: string) => new Date(`${iso}:00`).getTime();
const msg = (over: Partial<ChatMessage>): ChatMessage => ({
  id: "m",
  channelId: "c",
  sender: "Lucía",
  senderInitials: "LR",
  text: "hola",
  time: "10:00",
  ...over,
});

test("las etiquetas de día dicen Hoy, Ayer y la fecha larga", () => {
  assert.equal(dayLabel("2026-10-31", "2026-10-31"), "Hoy");
  assert.equal(dayLabel("2026-10-30", "2026-10-31"), "Ayer");
  assert.equal(dayLabel("2026-10-24", "2026-10-31"), "Sábado 24 de octubre");
});

test("los mensajes se agrupan por día y los de ejemplo cuentan como hoy", () => {
  const groups = groupByDay(
    [
      msg({ id: "a", createdAt: at("2026-10-30T09:00") }),
      msg({ id: "b", createdAt: at("2026-10-30T09:02") }),
      msg({ id: "c" }),
    ],
    "2026-10-31"
  );
  assert.deepEqual(groups.map((g) => [g.label, g.messages.length]), [["Ayer", 2], ["Hoy", 1]]);
});

test("un mensaje seguido del mismo autor no repite cabecera, salvo pasados cinco minutos", () => {
  const first = msg({ createdAt: at("2026-10-31T09:00") });
  assert.equal(continuesPrevious(first, msg({ createdAt: at("2026-10-31T09:03") })), true);
  assert.equal(continuesPrevious(first, msg({ createdAt: at("2026-10-31T09:06") })), false);
  assert.equal(continuesPrevious(first, msg({ sender: "Diego", createdAt: at("2026-10-31T09:01") })), false);
  assert.equal(continuesPrevious(msg({}), msg({})), false);
});

test("las respuestas salen del canal y se cuentan por mensaje", () => {
  const all = [msg({ id: "a" }), msg({ id: "b", parentId: "a" }), msg({ id: "c", parentId: "a" }), msg({ id: "d", channelId: "otro" })];
  assert.deepEqual(channelRoots(all, "c").map((m) => m.id), ["a"]);
  assert.equal(replyCounts(all).get("a"), 2);
});

test("la búsqueda ignora mayúsculas y acentos", () => {
  assert.equal(matchesQuery(msg({ text: "Revisión de la parrilla" }), "revision"), true);
  assert.equal(matchesQuery(msg({ text: "Revisión" }), "parrilla"), false);
  assert.equal(matchesQuery(msg({ text: "x" }), "  "), true);
});

test("reaccionar dos veces con el mismo emoji lo quita", () => {
  const once = toggleReaction(undefined, "👍", "Jair");
  assert.deepEqual(once, { "👍": ["Jair"] });
  assert.deepEqual(toggleReaction(once, "👍", "Lucía"), { "👍": ["Jair", "Lucía"] });
  assert.deepEqual(toggleReaction(once, "👍", "Jair"), {});
});

test("las iniciales salen de las dos primeras palabras", () => {
  assert.equal(initialsOf("Jair Bonilla"), "JB");
  assert.equal(initialsOf("Jair"), "JA");
  assert.equal(initialsOf("  "), "?");
});
