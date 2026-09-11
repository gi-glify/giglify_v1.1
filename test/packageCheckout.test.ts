import test from "node:test";
import assert from "node:assert/strict";
import { createPackageIdempotencyKey, getPackageDisplay } from "../src/lib/packageCheckout.ts";

test("exposes approved paid package display values", () => {
  assert.deepEqual(getPackageDisplay("pro"), {
    name: "Pro",
    priceUsd: 45,
    validityLabel: "3 months",
  });
  assert.deepEqual(getPackageDisplay("elite"), {
    name: "Elite",
    priceUsd: 120,
    validityLabel: "3 months",
  });
});

test("creates a valid idempotency key for each package attempt", () => {
  const key = createPackageIdempotencyKey("pro", "nonce-123456789012");
  assert.match(key, /^package-pro-[A-Za-z0-9._:-]{16,200}$/);
});
