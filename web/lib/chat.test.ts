import assert from "node:assert/strict";
import { test } from "node:test";
import {
  channelRoots,
  continuesPrevious,
  dayLabel,
  groupByDay,
  initialsOf,
  insertMention,
  isDormant,
  matchesQuery,
  mentionQuery,
  messageSegments,
  messageTime,
  nextOccurrence,
  replyCounts,
  scheduleChoices,
  toggleReaction,
} from "@/lib/chat";
import { cleanButtons, directKey, isMissingTable, rowToChannel, rowToMessage, unreadCount, type ChannelRow, type MessageRow } from "@/lib/chat-rows";
import { isAllowedTarget, isPrivateAddress } from "@/lib/chat-bot-delivery";
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

test("la hora se muestra en formato de 12 horas", () => {
  assert.equal(messageTime(msg({ createdAt: at("2026-10-31T12:02") })), "12:02 p.m.");
  assert.equal(messageTime(msg({ createdAt: at("2026-10-31T00:05") })), "12:05 a.m.");
  assert.equal(messageTime(msg({ time: "09:15" })), "9:15 a.m.");
});

test("una serie mensual conserva el día y no se desborda en meses cortos", () => {
  const start = at("2026-01-31T09:00");
  const next = new Date(nextOccurrence(start, "monthly", start));
  assert.deepEqual([next.getMonth(), next.getDate(), next.getHours()], [1, 28, 9]);
  const later = new Date(nextOccurrence(start, "monthly", at("2026-03-01T00:00")));
  assert.deepEqual([later.getMonth(), later.getDate()], [2, 31]);
});

test("una serie semanal salta a la primera fecha futura", () => {
  const start = at("2026-10-05T09:00");
  assert.equal(new Date(nextOccurrence(start, "weekly", at("2026-10-20T00:00"))).getDate(), 26);
});

test("los atajos de programar omiten lo que ya pasó o se repite", () => {
  const tarde = scheduleChoices(new Date("2026-10-31T20:00:00")).map((c) => c.label);
  assert.deepEqual(tarde, ["Mañana a las 9 a.m.", "El lunes a las 9 a.m."]);
  const domingo = scheduleChoices(new Date("2026-11-01T10:00:00")).map((c) => c.label);
  assert.deepEqual(domingo, ["Hoy a las 6 p.m.", "Mañana a las 9 a.m."]);
});

test("un canal es inactivo solo si todos sus mensajes tienen más de dos semanas", () => {
  const now = at("2026-10-31T12:00");
  assert.equal(isDormant([msg({ createdAt: at("2026-10-01T12:00") })], "c", now), true);
  assert.equal(isDormant([msg({ createdAt: at("2026-10-30T12:00") })], "c", now), false);
  assert.equal(isDormant([msg({})], "c", now), false);
  assert.equal(isDormant([], "c", now), false);
});

test("la mención se detecta antes del cursor y se inserta completa", () => {
  assert.equal(mentionQuery("hola @Lu", 8), "Lu");
  assert.equal(mentionQuery("correo@dominio", 14), null);
  assert.equal(mentionQuery("sin nada", 8), null);
  assert.deepEqual(insertMention("hola @Lu y ya", 8, "Lucía Ramírez"), { text: "hola @Lucía Ramírez  y ya", caret: 20 });
});

test("el mensaje separa menciones conocidas y enlaces", () => {
  assert.deepEqual(messageSegments("Hola @Lucía Ramírez mira https://hubly.mx/a", ["Lucía Ramírez"]), [
    { kind: "text", value: "Hola " },
    { kind: "mention", value: "@Lucía Ramírez" },
    { kind: "text", value: " mira " },
    { kind: "link", value: "https://hubly.mx/a" },
  ]);
  assert.deepEqual(messageSegments("@Nadie aquí", ["Lucía"]), [{ kind: "text", value: "@Nadie aquí" }]);
});

test("una fila vuelve a mensaje con reacciones agrupadas y hora local", () => {
  const m = rowToMessage(
    { id: "1", channel_id: "c", agency_id: "a", user_id: "u", sender_name: "Ana", sender_initials: "AN", sender_avatar: null, text: "hola", parent_id: null, attachment: null, pinned: true, edited_at: null, created_at: new Date(at("2026-10-31T12:02")).toISOString() },
    [{ message_id: "1", user_id: "u", user_name: "Ana", emoji: "🔥" }, { message_id: "1", user_id: "v", user_name: "Beto", emoji: "🔥" }]
  );
  assert.deepEqual(m.reactions, { "🔥": ["Ana", "Beto"] });
  assert.equal(m.time, "12:02 p.m.");
  assert.equal(m.pinned, true);
});

test("sin leer ignora lo propio, los hilos y lo ya leído", () => {
  const row = (over: Partial<MessageRow>): MessageRow => ({ id: "x", channel_id: "c", agency_id: "a", user_id: "otro", sender_name: "O", sender_initials: "O", sender_avatar: null, text: "t", parent_id: null, attachment: null, pinned: false, edited_at: null, created_at: "2026-10-31T12:00:00Z", ...over });
  const rows = [row({}), row({ user_id: "yo" }), row({ parent_id: "p" }), row({ created_at: "2026-10-30T12:00:00Z" }), row({ channel_id: "d" })];
  assert.equal(unreadCount(rows, "c", "yo", "2026-10-31T00:00:00Z"), 1);
  assert.equal(unreadCount(rows, "c", "yo", null), 2);
});

test("un directo se llama como la otra persona y su clave no depende del orden", () => {
  const row: ChannelRow = { id: "c", agency_id: "a", kind: "direct", name: "guardado", description: "", emoji: "", brand_id: null, unique_key: "k", member_ids: ["yo", "ana"], is_archived: false };
  const channel = rowToChannel(row, "yo", [{ id: "ana", name: "Ana Ruiz" }], { channel_id: "c", muted: true, pinned: false, hidden: false, last_read_at: null }, 2);
  assert.equal(channel.name, "Ana Ruiz");
  assert.equal(channel.memberId, "ana");
  assert.equal(channel.muted, true);
  assert.equal(directKey("b", "a"), directKey("a", "b"));
});

test("distingue tablas ausentes de otros errores", () => {
  assert.equal(isMissingTable({ code: "PGRST205" }), true);
  assert.equal(isMissingTable({ code: "42P01" }), true);
  assert.equal(isMissingTable({ code: "42501", message: "denied" }), false);
  assert.equal(isMissingTable(null), false);
});

test("los botones de un bot se limpian antes de guardarse", () => {
  assert.deepEqual(cleanButtons([{ id: "si", texto: "Sí", estilo: "principal" }, { id: "si", texto: "otra" }, { id: "mal id", texto: "x" }, { id: "b" }, "x"]), [{ id: "si", texto: "Sí", estilo: "principal" }]);
  assert.deepEqual(cleanButtons("nada"), []);
  assert.equal(cleanButtons(Array.from({ length: 9 }, (_, i) => ({ id: `b${i}`, texto: "t" }))).length, 5);
});

test("un bot no puede alcanzar la red interna", async () => {
  for (const ip of ["127.0.0.1", "10.0.0.8", "192.168.1.1", "172.16.0.1", "169.254.169.254", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "0.0.0.0"]) {
    assert.equal(isPrivateAddress(ip), true, ip);
  }
  assert.equal(isPrivateAddress("8.8.8.8"), false);
  assert.equal(await isAllowedTarget("http://8.8.8.8/x", false), false);
  assert.equal(await isAllowedTarget("https://169.254.169.254/latest", false), false);
  assert.equal(await isAllowedTarget("https://user:pw@8.8.8.8/", false), false);
  assert.equal(await isAllowedTarget("http://localhost:1/x", false), false);
  assert.equal(await isAllowedTarget("no es url", false), false);
  assert.equal(await isAllowedTarget("https://8.8.8.8/x", false), true);
});
