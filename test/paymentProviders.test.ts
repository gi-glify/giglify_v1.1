import test from "node:test";
import assert from "node:assert/strict";
import {
  PAYMENT_PROVIDERS,
  getProviderField,
  getCheckoutLabel,
  validateProviderInput,
} from "../src/lib/paymentProviders.ts";

test("exposes the approved providers in tab order", () => {
  assert.deepEqual(PAYMENT_PROVIDERS.map((provider) => provider.id), ["paystack", "paypal", "palpluss"]);
  assert.deepEqual(PAYMENT_PROVIDERS.map((provider) => provider.label), ["Paystack", "PayPal", "PalPluss"]);
});

test("requires a valid email for Paystack checkout", () => {
  assert.equal(validateProviderInput("paystack", { email: "" }), "Enter a valid email address for Paystack checkout.");
  assert.equal(validateProviderInput("paystack", { email: "worker@example.com" }), null);
  assert.equal(getProviderField("paystack").label, "Paystack email address");
});

test("requires a valid email for PayPal approval checkout", () => {
  assert.equal(validateProviderInput("paypal", { email: "not-an-email" }), "Enter a valid email address for PayPal checkout.");
  assert.equal(validateProviderInput("paypal", { email: "worker@example.com" }), null);
  assert.equal(getCheckoutLabel("paypal"), "Continue to PayPal approval");
});

test("requires a valid phone for PalPluss STK", () => {
  assert.equal(validateProviderInput("palpluss", { phone: "123" }), "Enter a valid phone number for the PalPluss STK prompt.");
  assert.equal(validateProviderInput("palpluss", { phone: "+254 712 345 678" }), null);
  assert.equal(getProviderField("palpluss").label, "PalPluss phone number");
});
