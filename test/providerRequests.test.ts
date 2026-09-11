import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPackageProviderRequest,
  type ProviderRequestInput,
} from "../supabase/functions/_shared/provider-requests.ts";

const base: ProviderRequestInput = {
  provider: "paystack",
  tuid: "GIG-20260911120000-ABC123",
  amountUsd: 45,
  email: "admin-test@example.com",
  idempotencyKey: "checkout-1234567890123456",
  callbackUrl: "https://api.example.com/payment-callback",
  returnUrl: "https://app.example.com/deposit?payment=return",
  cancelUrl: "https://app.example.com/deposit?payment=cancel",
};

test("builds a Paystack initialization request in minor currency units", () => {
  const request = buildPackageProviderRequest(base, { secret: "paystack-secret" });
  assert.equal(request.url, "https://api.paystack.co/transaction/initialize");
  assert.equal(request.headers.Authorization, "Bearer paystack-secret");
  assert.deepEqual(JSON.parse(request.body), {
    amount: "4500",
    currency: "USD",
    email: "admin-test@example.com",
    reference: "GIG-20260911120000-ABC123",
    callback_url: "https://api.example.com/payment-callback",
    metadata: JSON.stringify({ tuid: "GIG-20260911120000-ABC123" }),
  });
});

test("builds a PayPal order request with explicit approval URLs", () => {
  const request = buildPackageProviderRequest({ ...base, provider: "paypal" }, { accessToken: "paypal-token" });
  assert.equal(request.url, "https://api-m.sandbox.paypal.com/v2/checkout/orders");
  assert.equal(request.headers.Authorization, "Bearer paypal-token");
  assert.deepEqual(JSON.parse(request.body), {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: "GIG-20260911120000-ABC123",
      custom_id: "GIG-20260911120000-ABC123",
      amount: { currency_code: "USD", value: "45.00" },
    }],
    application_context: {
      return_url: "https://app.example.com/deposit?payment=return",
      cancel_url: "https://app.example.com/deposit?payment=cancel",
    },
  });
});

test("builds an M-Pesa STK request only when KES and phone are supplied", () => {
  const request = buildPackageProviderRequest({
    ...base,
    provider: "mpesa",
    phone: "254712345678",
    amountKes: 5603,
  }, { secret: "palpluss-key" });
  assert.equal(request.url, "https://api.palpluss.com/v1/payments/stk");
  assert.equal(request.headers.Authorization, "Basic " + btoa("palpluss-key:"));
  assert.deepEqual(JSON.parse(request.body), {
    amount: 5603,
    phone: "254712345678",
    accountReference: "GIG-20260911120000-ABC123",
    transactionDesc: "Giglify package purchase",
    callbackUrl: "https://api.example.com/payment-callback",
  });
});

test("rejects M-Pesa requests without an explicit KES amount", () => {
  assert.throws(
    () => buildPackageProviderRequest({ ...base, provider: "mpesa", phone: "254712345678" }, { secret: "palpluss-key" }),
    /M-Pesa requires PalPluss secret, amountKes, and phone/,
  );
});
