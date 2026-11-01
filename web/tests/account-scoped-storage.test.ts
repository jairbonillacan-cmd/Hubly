import assert from "node:assert/strict";
import { test } from "node:test";
import { adoptLegacyKey, scopedKey, type StorageLike } from "../lib/account-scoped-storage";

function mockStorage(initial: Record<string, string> = {}): StorageLike & { dump(): Record<string, string | null> } {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? (data.get(k) as string) : null),
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    dump: () => Object.fromEntries(data.entries()),
  };
}

test("scopedKey compone agencia y cuenta", () => {
  assert.equal(scopedKey("hubly:chats-hubi", "ag1", "u1"), "hubly:chats-hubi:ag1:u1");
});

test("adoptLegacyKey migra el valor a la clave por cuenta y borra la antigua", () => {
  const s = mockStorage({ "hubly:chats-hubi:ag1": '[{"id":"c1"}]' });
  const value = adoptLegacyKey("hubly:chats-hubi:ag1", "hubly:chats-hubi:ag1:u1", s);
  assert.equal(value, '[{"id":"c1"}]');
  assert.equal(s.getItem("hubly:chats-hubi:ag1"), null);
  assert.equal(s.getItem("hubly:chats-hubi:ag1:u1"), '[{"id":"c1"}]');
});

test("adoptLegacyKey no hace nada sin clave antigua", () => {
  const s = mockStorage();
  assert.equal(adoptLegacyKey("hubly:chats-hubi:ag1", "hubly:chats-hubi:ag1:u1", s), null);
  assert.equal(s.getItem("hubly:chats-hubi:ag1:u1"), null);
});

test("adoptLegacyKey no pisa una clave por cuenta que ya existe", () => {
  const s = mockStorage({ "hubly:chats-hubi:ag1": "legado", "hubly:chats-hubi:ag1:u1": "nuevo" });
  assert.equal(adoptLegacyKey("hubly:chats-hubi:ag1", "hubly:chats-hubi:ag1:u1", s), "nuevo");
  assert.equal(s.getItem("hubly:chats-hubi:ag1"), null);
});
