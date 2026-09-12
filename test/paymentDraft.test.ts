import test from "node:test";
import assert from "node:assert/strict";
import { parsePaymentIntent, readPaymentDraft, writePaymentDraft, clearPaymentDraft, readPaymentViewPreference, writePaymentViewPreference, type PaymentDraft } from "../src/lib/paymentDraft.ts";

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test("persists only safe payment draft fields and restores them", () => {
  const storage = createStorage();
  const draft: PaymentDraft = {
    flow: "package",
    tier: "pro",
    provider: "mpesa",
    accountLabel: "Primary",
    email: "worker@example.com",
    phone: "+254700000000",
    step: "provider",
  };
  writePaymentDraft("package", draft, storage);
  assert.deepEqual(readPaymentDraft("package", storage), draft);
  assert.doesNotMatch(storage.getItem("giglify:payment-draft:package") || "", /secret|token|checkout/i);
});

test("drops malformed drafts and supports clearing a flow", () => {
  const storage = createStorage();
  storage.setItem("giglify:payment-draft:verification", "not-json");
  assert.equal(readPaymentDraft("verification", storage), null);
  writePaymentDraft("verification", { flow: "verification", step: "details" }, storage);
  clearPaymentDraft("verification", storage);
  assert.equal(readPaymentDraft("verification", storage), null);
});

test("parses explicit payment entry intent and defaults safely", () => {
  assert.equal(parsePaymentIntent("?view=packages", undefined), "packages");
  assert.equal(parsePaymentIntent("?view=verification", undefined), "verification");
  assert.equal(parsePaymentIntent("?view=unknown", undefined), "auto");
  assert.equal(parsePaymentIntent("", { view: "verification" }), "verification");
  assert.equal(parsePaymentIntent("", undefined), "auto");
});

test("persists the last safe payment view preference", () => {
  const storage = createStorage();
  writePaymentViewPreference("verification", storage);
  assert.equal(readPaymentViewPreference(storage), "verification");
});
