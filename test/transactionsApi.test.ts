import test from "node:test";
import assert from "node:assert/strict";
import { mapTransactionRow, transactionsToCsv } from "../src/lib/transactions.ts";

test("maps package and provider statuses into the Financials transaction shape", () => {
  assert.deepEqual(mapTransactionRow({
    id: "tx-1",
    user_id: "user-1",
    tuid: "GIG-123",
    transaction_type: "package_purchase",
    provider: "mpesa",
    amount: 45,
    currency: "USD",
    status: "processing",
    user_message: "Waiting",
    created_at: "2026-09-12T00:00:00Z",
  }), {
    id: "tx-1",
    userId: "user-1",
    tuid: "GIG-123",
    provider: "mpesa",
    type: "deposit",
    amount: 45,
    currency: "USD",
    status: "pending",
    timestamp: "2026-09-12T00:00:00Z",
    description: "Waiting",
  });
});

test("exports visible transactions with CSV escaping", () => {
  const csv = transactionsToCsv([mapTransactionRow({
    id: "tx-1", user_id: "user-1", tuid: "GIG-1", transaction_type: "withdrawal", provider: "paypal",
    amount: 12.5, currency: "USD", status: "failed", user_message: 'Failed, "review"', created_at: "2026-09-12T00:00:00Z",
  })]);
  assert.match(csv, /^Date,TUID,Description,Type,Provider,Amount,Currency,Status/);
  assert.match(csv, /"Failed, ""review"""/);
});
