import assert from "node:assert/strict";
import test from "node:test";
import { attachPaymentAccount, type PaymentAccountProfile } from "../supabase/functions/_shared/payment-accounts.ts";

const profile: PaymentAccountProfile = {
  id: "user-1",
  first_name: "Amos",
  last_name: "Smith",
  email: "amos@example.com",
};

test("attaches the user's readable account identity to an admin payment row", () => {
  assert.deepEqual(attachPaymentAccount({ id: "payment-1", user_id: profile.id }, profile), {
    id: "payment-1",
    user_id: "user-1",
    account_name: "Amos Smith",
    account_email: "amos@example.com",
  });
});

test("falls back safely when a payment profile has no name or email", () => {
  assert.deepEqual(attachPaymentAccount({ id: "payment-2", user_id: "user-2" }, { id: "user-2", first_name: null, last_name: null, email: null }), {
    id: "payment-2",
    user_id: "user-2",
    account_name: "Unnamed account",
    account_email: null,
  });
});
