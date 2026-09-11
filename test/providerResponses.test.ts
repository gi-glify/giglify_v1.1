import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProviderResponse } from "../supabase/functions/_shared/provider-responses.ts";

test("normalizes a Paystack initialization response", () => {
  const result = normalizeProviderResponse("paystack", {
    status: true,
    data: {
      reference: "GIG-20260911120000-ABC123",
      authorization_url: "https://checkout.paystack.com/example",
      access_code: "access-code",
    },
  });

  assert.deepEqual(result, {
    providerRequestId: "GIG-20260911120000-ABC123",
    checkoutUrl: "https://checkout.paystack.com/example",
    clientSecret: "access-code",
  });
});

test("normalizes a PayPal order response using its approval link", () => {
  const result = normalizeProviderResponse("paypal", {
    id: "5O190127TN364715T",
    status: "CREATED",
    links: [{ rel: "approve", href: "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T" }],
  });

  assert.deepEqual(result, {
    providerRequestId: "5O190127TN364715T",
    checkoutUrl: "https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T",
  });
});

test("normalizes a Palpluss response using the provider transaction identifier", () => {
  const result = normalizeProviderResponse("palpluss", {
    transactionId: "PL-12345",
    status: "pending",
    message: "STK prompt sent",
  });

  assert.deepEqual(result, {
    providerRequestId: "PL-12345",
  });
});

test("rejects provider responses without a usable request identifier", () => {
  assert.throws(
    () => normalizeProviderResponse("paystack", { status: true, data: {} }),
    /provider request identifier/,
  );
});
