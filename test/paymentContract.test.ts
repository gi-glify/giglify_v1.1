import test from "node:test";
import assert from "node:assert/strict";
import { parsePackagePaymentRequest } from "../supabase/functions/_shared/package-contract.ts";

test("accepts a paid package and approved provider", () => {
  assert.deepEqual(
    parsePackagePaymentRequest({ tier: "pro", provider: "paystack", idempotencyKey: "checkout-1234567890123456" }),
    { tier: "pro", provider: "paystack", idempotencyKey: "checkout-1234567890123456" },
  );
});

test("rejects Free package purchases", () => {
  assert.equal(parsePackagePaymentRequest({ tier: "free", provider: "paypal", idempotencyKey: "checkout-1234567890123456" }), null);
});

test("rejects unapproved providers and malformed values", () => {
  assert.equal(parsePackagePaymentRequest({ tier: "elite", provider: "stripe", idempotencyKey: "checkout-1234567890123456" }), null);
  assert.deepEqual(parsePackagePaymentRequest({ tier: "elite", provider: "paystack", idempotencyKey: "checkout-1234567890123456" }), { tier: "elite", provider: "paystack", idempotencyKey: "checkout-1234567890123456" });
  assert.equal(parsePackagePaymentRequest({ tier: "pro", idempotencyKey: "checkout-1234567890123456" }), null);
  assert.equal(parsePackagePaymentRequest({ tier: "pro", provider: "paystack" }), null);
  assert.equal(parsePackagePaymentRequest(null), null);
});
