import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("migration exposes an idempotent server-only package settlement routine", async () => {
  const migration = await readFile("supabase/migrations/20260911120000_package_payment_foundation.sql", "utf8");
  assert.match(migration, /create or replace function public\.settle_package_payment/i);
  assert.match(migration, /payment_attempts.*for update/is);
  assert.match(migration, /package_entitlements.*status = 'replaced'/is);
  assert.match(migration, /verification_status = 'verified'/i);
  assert.match(migration, /grant execute on function public\.settle_package_payment.*to service_role/is);
});
