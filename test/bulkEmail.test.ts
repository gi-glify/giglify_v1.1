import assert from "node:assert/strict";
import test from "node:test";
import { chunkRecipients, selectMarketingRecipients, type MarketingUser } from "../supabase/functions/_shared/bulk-email.ts";

const users: MarketingUser[] = [
  { id: "confirmed", email: "confirmed@example.com", emailConfirmedAt: "2026-10-01T00:00:00.000Z", firstName: "Confirmed", lastName: "User", isAdmin: false, optedOut: false },
  { id: "unconfirmed", email: "unconfirmed@example.com", emailConfirmedAt: null, firstName: "Unconfirmed", lastName: "User", isAdmin: false, optedOut: false },
  { id: "admin", email: "admin@example.com", emailConfirmedAt: "2026-10-01T00:00:00.000Z", firstName: "Admin", lastName: "User", isAdmin: true, optedOut: false },
  { id: "opted-out", email: "opted@example.com", emailConfirmedAt: "2026-10-01T00:00:00.000Z", firstName: "Opted", lastName: "Out", isAdmin: false, optedOut: true },
  { id: "missing-email", email: null, emailConfirmedAt: "2026-10-01T00:00:00.000Z", firstName: "Missing", lastName: "Email", isAdmin: false, optedOut: false },
];

test("selectMarketingRecipients keeps only confirmed, non-admin, opted-in users with email", () => {
  assert.deepEqual(selectMarketingRecipients(users), [users[0]]);
});

test("chunkRecipients never creates a Resend batch larger than 100", () => {
  const many = Array.from({ length: 205 }, (_, index) => ({ ...users[0], id: `user-${index}`, email: `user-${index}@example.com` }));
  const batches = chunkRecipients(many, 100);
  assert.deepEqual(batches.map((batch) => batch.length), [100, 100, 5]);
  assert.equal(batches.flat().length, 205);
});
