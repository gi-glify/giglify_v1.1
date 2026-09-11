import test from "node:test";
import assert from "node:assert/strict";
import { getPaymentProgress, isPaymentProgressTerminal } from "../src/lib/paymentProgress.ts";

test("maps an M-Pesa pending payment to an actionable STK progress state", () => {
  assert.deepEqual(getPaymentProgress("pending", "package", "mpesa"), {
    phase: "awaiting_confirmation",
    label: "Waiting for M-Pesa confirmation",
    description: "Check your phone and approve the STK prompt. Your payment will update automatically after provider confirmation.",
    terminal: false,
  });
});

test("maps a successful verification deposit to a completed progress state", () => {
  assert.deepEqual(getPaymentProgress("held", "verification", "mpesa"), {
    phase: "review",
    label: "Payment received — awaiting admin review",
    description: "Your verification payment was received and is now held for the normal admin-review flow.",
    terminal: true,
  });
});

test("maps failed and completed provider statuses to terminal states", () => {
  assert.equal(getPaymentProgress("failed", "package", "paypal").phase, "failed");
  assert.equal(getPaymentProgress("completed", "package", "paypal").phase, "complete");
  assert.equal(isPaymentProgressTerminal("failed"), true);
  assert.equal(isPaymentProgressTerminal("processing"), false);
});
