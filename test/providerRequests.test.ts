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
  }, { accessToken: "mpesa-token", shortCode: "174379", passkey: "mpesa-passkey" });
  assert.equal(request.url, "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest");
  assert.equal(request.headers.Authorization, "Bearer mpesa-token");
  assert.deepEqual(JSON.parse(request.body), {
    BusinessShortCode: "174379",
    Password: JSON.parse(request.body).Password,
    Timestamp: JSON.parse(request.body).Timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: 5603,
    PartyA: "254712345678",
    PartyB: "174379",
    PhoneNumber: "254712345678",
    CallBackURL: "https://api.example.com/payment-callback",
    AccountReference: "GIG-20260911120000-ABC123",
    TransactionDesc: "Giglify package purchase",
  });
});

test("rejects M-Pesa requests without an explicit KES amount", () => {
  assert.throws(
    () => buildPackageProviderRequest({ ...base, provider: "mpesa", phone: "254712345678" }, { accessToken: "mpesa-token", shortCode: "174379", passkey: "mpesa-passkey" }),
    /M-Pesa requires .*amountKes.*phone/,
  );
});
