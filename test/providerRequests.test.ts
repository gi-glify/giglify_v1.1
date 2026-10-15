import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPackageProviderRequest,
  type ProviderRequestInput,
} from "../supabase/functions/_shared/provider-requests.ts";

const base: ProviderRequestInput = {
  provider: "paystack",
  tuid: "GIG-20260911120000-ABC123",
  amountUsd: 19,
  email: "admin-test@example.com",
  idempotencyKey: "checkout-1234567890123456",
  callbackUrl: "https://api.example.com/payment-callback",
  checkoutReturnUrl: "https://app.example.com/deposit?payment=return",
  returnUrl: "https://app.example.com/deposit?payment=return",
  cancelUrl: "https://app.example.com/deposit?payment=cancel",
};

test("builds a Paystack initialization request in minor currency units", () => {
  const request = buildPackageProviderRequest(base, { secret: "paystack-secret" });
  assert.equal(request.url, "https://api.paystack.co/transaction/initialize");
  assert.equal(request.headers.Authorization, "Bearer paystack-secret");
  assert.deepEqual(JSON.parse(request.body), {
    amount: "1900",
    currency: "USD",
    email: "admin-test@example.com",
    reference: "GIG-20260911120000-ABC123",
    callback_url: "https://app.example.com/deposit?payment=return",
    metadata: JSON.stringify({ tuid: "GIG-20260911120000-ABC123" }),
  });
});

test("builds a PayPal order request with explicit approval URLs", () => {
  const request = buildPackageProviderRequest({ ...base, provider: "paypal" }, { accessToken: "paypal-token", baseUrl: "https://api-m.sandbox.paypal.com" });
  assert.equal(request.url, "https://api-m.sandbox.paypal.com/v2/checkout/orders");
  assert.equal(request.headers.Authorization, "Bearer paypal-token");
  assert.deepEqual(JSON.parse(request.body), {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: "GIG-20260911120000-ABC123",
      custom_id: "GIG-20260911120000-ABC123",
    amount: { currency_code: "USD", value: "19.00" },
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
    phone: "0712345678",
    amountKes: 5603,
  }, {
    accessToken: "daraja-access-token",
    baseUrl: "https://api.safaricom.co.ke",
    shortCode: "1237946",
    passkey: "daraja-passkey",
    tillNumber: "1708580",
    shortcodeType: "till",
  });
  assert.equal(request.url, "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest");
  assert.equal(request.headers.Authorization, "Bearer daraja-access-token");
  const body = JSON.parse(request.body);
  assert.deepEqual({ ...body, Password: undefined, Timestamp: undefined }, {
    BusinessShortCode: "1237946",
    Password: undefined,
    Timestamp: undefined,
    TransactionType: "CustomerBuyGoodsOnline",
    Amount: 5603,
    PartyA: "254712345678",
    PartyB: "1708580",
    PhoneNumber: "254712345678",
    AccountReference: base.tuid.slice(-12),
    TransactionDesc: "Package",
    CallBackURL: "https://api.example.com/payment-callback",
  });
  assert.match(body.Timestamp, /^20\d{12}$/);
  assert.ok(body.Password);
});

test("rejects M-Pesa requests without an explicit KES amount", () => {
  assert.throws(
    () => buildPackageProviderRequest({ ...base, provider: "mpesa", phone: "254712345678" }, { accessToken: "daraja-access-token", shortCode: "1237946", passkey: "daraja-passkey" }),
    /M-Pesa requires Daraja credentials, amountKes, and phone/,
  );
});
