import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseVerificationPaymentRequest } from "../supabase/functions/_shared/verification-contract.ts";

test("accepts approved Paystack verification input", () => {
  assert.deepEqual(
    parseVerificationPaymentRequest({
      method: "paystack",
      accountLabel: "Primary email",
      accountValue: "worker@example.com",
      email: "worker@example.com",
    }),
    {
      method: "paystack",
      accountLabel: "Primary email",
      accountValue: "worker@example.com",
      email: "worker@example.com",
    },
  );
});

test("accepts PayPal approval and M-Pesa STK verification input", () => {
  assert.equal(parseVerificationPaymentRequest({
    method: "paypal",
    accountLabel: "PayPal",
    accountValue: "worker@example.com",
    email: "worker@example.com",
  })?.method, "paypal");
  assert.equal(parseVerificationPaymentRequest({
    method: "mpesa",
    accountLabel: "M-Pesa",
    accountValue: "+254 712 345 678",
    phone: "+254 712 345 678",
  })?.method, "mpesa");
});

test("rejects unsupported providers and provider-specific invalid fields", () => {
  assert.equal(parseVerificationPaymentRequest({ method: "stripe", accountLabel: "x", accountValue: "x" }), null);
  assert.equal(parseVerificationPaymentRequest({ method: "paystack", accountLabel: "x", accountValue: "bad", email: "bad" }), null);
  assert.equal(parseVerificationPaymentRequest({ method: "mpesa", accountLabel: "x", accountValue: "123", phone: "123" }), null);
});

test("verification retries can reuse an existing payout account", async () => {
  const source = await readFile("supabase/functions/create-verification-payment/index.ts", "utf8");
  assert.match(source, /account_fingerprint/);
  assert.match(source, /already registered|existing payout account/i);
  assert.match(source, /\.eq\("account_fingerprint", accountFingerprint\)/);
});
