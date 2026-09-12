import test from "node:test";
import assert from "node:assert/strict";
import { getNextPaymentStep, getPreviousPaymentStep, PAYMENT_WIZARD_STEPS } from "../src/lib/paymentWizard.ts";

test("keeps users on the current step until validation passes", () => {
  assert.equal(getNextPaymentStep("details", false), "details");
  assert.equal(getNextPaymentStep("details", true), "provider");
  assert.equal(getNextPaymentStep("result", true), "result");
});

test("supports backward navigation without skipping the wizard order", () => {
  assert.deepEqual(PAYMENT_WIZARD_STEPS, ["details", "provider", "payment", "result"]);
  assert.equal(getPreviousPaymentStep("payment"), "provider");
  assert.equal(getPreviousPaymentStep("details"), "details");
});
