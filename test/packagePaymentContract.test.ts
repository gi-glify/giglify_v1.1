import test from "node:test";
import assert from "node:assert/strict";
import {
  APPROVED_PAYMENT_PROVIDERS,
  TRANSACTION_STATUSES,
} from "../src/lib/packageRules.ts";

test("exposes only the approved payment providers", () => {
  assert.deepEqual(APPROVED_PAYMENT_PROVIDERS, ["palpluss", "paystack", "paypal"]);
});

test("exposes the transaction states used by the backend contract", () => {
  assert.deepEqual(TRANSACTION_STATUSES, [
    "created",
    "pending",
    "processing",
    "success",
    "failed",
    "cancelled",
    "verification_required",
    "expired",
  ]);
});

test("keeps the legacy transaction ledger compatible with package payments", async () => {
  const { readFile } = await import("node:fs/promises");
  const migration = await readFile("supabase/migrations/20260911120000_package_payment_foundation.sql", "utf8");
  assert.match(migration, /add column if not exists provider/i);
  assert.match(migration, /add column if not exists transaction_type/i);
  assert.match(migration, /status_compatibility_check/i);
  assert.match(migration, /type: "deposit"|type text/i);
});
