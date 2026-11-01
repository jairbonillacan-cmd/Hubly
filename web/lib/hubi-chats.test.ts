import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { chatTimeLabel, chatTitleFrom, DELETE_UNDO_MS, NEW_CHAT_TITLE, useHubiChats, type HubiTurn } from "@/lib/hubi-chats";

const userTurn = (text: string): HubiTurn => ({ id: text, role: "user", text, timestamp: "10:00" });
const chats = () => useHubiChats.getState();

beforeEach(() => {
  mock.timers.enable({ apis: ["setTimeout", "Date"] });
  useHubiChats.setState({ scope: "prueba", chats: [], activeChatId: null, fullView: false, deleted: [] });
});

afterEach(() => mock.timers.reset());

test("el título sale del primer mensaje y no cambia con los siguientes", () => {
  chats().appendTurns([userTurn("  ¿Qué   vence hoy?  ")]);
  chats().appendTurns([userTurn("Otra pregunta")]);
  assert.equal(chats().chats[0].title, "¿Qué vence hoy?");
  assert.equal(chats().chats[0].turns.length, 2);
});

test("un título vacío conserva el nombre por defecto", () => {
  assert.equal(chatTitleFrom("   "), NEW_CHAT_TITLE);
});

test("nueva conversación reutiliza la vacía en lugar de duplicarla", () => {
  chats().startChat();
  chats().startChat();
  assert.equal(chats().chats.length, 1);
  assert.equal(chats().fullView, true);
});

test("restaurar dentro de los 10 segundos devuelve la conversación a su lugar", () => {
  chats().appendTurns([userTurn("Primera")]);
  mock.timers.tick(1000);
  chats().startChat();
  chats().appendTurns([userTurn("Segunda")]);
  mock.timers.tick(1000);
  const [recent, old] = chats().chats;

  chats().deleteChat(recent.id);
  assert.equal(chats().activeChatId, null);
  mock.timers.tick(DELETE_UNDO_MS - 1);
  chats().restoreChat(recent.id);

  assert.deepEqual(chats().chats.map((chat) => chat.id), [recent.id, old.id]);
  assert.equal(chats().deleted.length, 0);

  mock.timers.tick(DELETE_UNDO_MS);
  assert.equal(chats().chats.length, 2);
});

test("pasados los 10 segundos ya no se puede restaurar", () => {
  chats().appendTurns([userTurn("Se va")]);
  const { id } = chats().chats[0];

  chats().deleteChat(id);
  mock.timers.tick(DELETE_UNDO_MS);
  chats().restoreChat(id);

  assert.equal(chats().deleted.length, 0);
  assert.equal(chats().chats.length, 0);
});

test("cada conversación eliminada mantiene su propia ventana para restaurar", () => {
  chats().appendTurns([userTurn("Uno")]);
  chats().startChat();
  chats().appendTurns([userTurn("Dos")]);
  const [second, first] = chats().chats;

  chats().deleteChat(first.id);
  mock.timers.tick(4000);
  chats().deleteChat(second.id);
  mock.timers.tick(6000);

  assert.deepEqual(chats().deleted.map((item) => item.chat.id), [second.id]);
});

test("la hora se muestra hoy y la fecha en otros días", () => {
  const now = new Date(2026, 9, 31, 18, 12);
  assert.match(chatTimeLabel(now.getTime(), now), /06:12/);
  assert.equal(chatTimeLabel(new Date(2026, 9, 29, 9, 0).getTime(), now), "29 oct");
});
