import assert from "node:assert/strict";
import test from "node:test";
import { summarizePayoutAccount } from "../supabase/functions/_shared/finance.ts";

test("summarizes task credits and payout obligations without mixing them", () => {
  assert.deepEqual(summarizePayoutAccount("worker-1", {
    walletBalance: 145.5,
    credits: [
      { user_id: "worker-1", reward_paid: 100, reward_approved: 100 },
      { user_id: "worker-1", reward_paid: null, reward_approved: 45.5 },
      { user_id: "worker-2", reward_paid: 999, reward_approved: 999 },
    ],
    payouts: [
      { user_id: "worker-1", amount: 70, status: "paid" },
      { user_id: "worker-1", amount: 30, status: "approved" },
      { user_id: "worker-1", amount: 10, status: "requested" },
      { user_id: "worker-1", amount: 5, status: "rejected" },
    ],
  }), {
    walletBalance: 145.5,
    taskCredits: 145.5,
    payoutsPaid: 70,
    payoutsPending: 40,
    availableAfterPayouts: 35.5,
  });
});

test("does not report negative available credit", () => {
  assert.equal(summarizePayoutAccount("worker-1", {
    walletBalance: 20,
    credits: [{ user_id: "worker-1", reward_paid: 20, reward_approved: 20 }],
    payouts: [{ user_id: "worker-1", amount: 70, status: "paid" }],
  }).availableAfterPayouts, 0);
});
