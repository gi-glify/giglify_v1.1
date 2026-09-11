import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("migration enforces package access and records task usage at submission start", async () => {
  const migration = await readFile("supabase/migrations/20260911120000_package_payment_foundation.sql", "utf8");
  assert.match(migration, /insert into public\.package_entitlements/i);
  assert.match(migration, /enforce_task_package_access/i);
  assert.match(migration, /minimum_tier/i);
  assert.match(migration, /tasks_allowed/i);
  assert.match(migration, /insert into public\.package_usage_events/i);
  assert.match(migration, /before insert on public\.task_submissions/i);
  assert.match(migration, /after insert on public\.task_submissions/i);
  assert.match(migration, /expire_due_package_entitlements/i);
  assert.match(migration, /renewal_at <= now\(\)/i);
});
