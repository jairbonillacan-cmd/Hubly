import assert from "node:assert/strict";
import { test } from "node:test";
import { secureForProtocol } from "../lib/supabase/cookie-options";

test("secureForProtocol marca la cookie Secure solo bajo https", () => {
  assert.equal(secureForProtocol("https:"), true);
  assert.equal(secureForProtocol("https"), true);
  assert.equal(secureForProtocol("https, http"), true);
  assert.equal(secureForProtocol("HTTPS"), true);
  assert.equal(secureForProtocol("http:"), false);
  assert.equal(secureForProtocol(undefined), false);
  assert.equal(secureForProtocol(""), false);
});
