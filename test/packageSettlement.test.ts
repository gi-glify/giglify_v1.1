import test from "node:test";
import assert from "node:assert/strict";
import { normalizePackagePaymentEvent } from "../supabase/functions/_shared/package-settlement.ts";

test("normalizes a successful Paystack charge event", () => {
  assert.deepEqual(normalizePackagePaymentEvent("paystack", {
    id: "evt_123",
    event: "charge.success",
    data: { id: 9876, status: "success", reference: "GIG-ABC" },
  }), {
    eventId: "evt_123",
    providerRequestId: "GIG-ABC",
    tuid: "GIG-ABC",
    status: "success",
  });
});

test("keeps a PayPal order approval event pending until capture completes", () => {
  assert.deepEqual(normalizePackagePaymentEvent("paypal", {
    id: "WH-123",
    event_type: "CHECKOUT.ORDER.APPROVED",
    resource: { id: "ORDER-123", purchase_units: [{ custom_id: "GIG-ABC" }] },
  }), {
    eventId: "WH-123",
    providerRequestId: "ORDER-123",
    tuid: "GIG-ABC",
    status: "pending",
  });
});

test("normalizes a completed PayPal capture", () => {
  assert.deepEqual(normalizePackagePaymentEvent("paypal", {
    id: "WH-124",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: "CAPTURE-123",
      supplementary_data: { related_ids: { order_id: "ORDER-123" } },
      custom_id: "GIG-ABC",
    },
  }), {
    eventId: "WH-124",
    providerRequestId: "ORDER-123",
    tuid: "GIG-ABC",
    status: "success",
  });
});

test("normalizes an M-Pesa STK callback", () => {
  assert.deepEqual(normalizePackagePaymentEvent("mpesa", {
    Body: { stkCallback: {
      MerchantRequestID: "mr-3",
      CheckoutRequestID: "ws_CO_123",
      ResultCode: 0,
    }},
  }), {
    eventId: "ws_CO_123",
    providerRequestId: "ws_CO_123",
    tuid: "ws_CO_123",
    status: "success",
  });
});

test("rejects callbacks without an event ID or Giglify transaction reference", () => {
  assert.throws(
    () => normalizePackagePaymentEvent("paystack", { event: "charge.success", data: {} }),
    /event ID or transaction reference/,
  );
});

test("normalizes cancelled and expired M-Pesa callbacks as terminal failures", () => {
  assert.equal(normalizePackagePaymentEvent("mpesa", {
    id: "evt-cancelled",
    event_type: "stk.cancelled",
    transaction: { external_reference: "GIG-CANCELLED", provider_request_id: "PL-CANCELLED", status: "CANCELLED" },
  }).status, "cancelled");
  assert.equal(normalizePackagePaymentEvent("mpesa", {
    id: "evt-expired",
    event_type: "stk.expired",
    transaction: { external_reference: "GIG-EXPIRED", provider_request_id: "PL-EXPIRED", status: "EXPIRED" },
  }).status, "expired");
});

test("normalizes a failed Paystack callback without activating a package", () => {
  assert.equal(normalizePackagePaymentEvent("paystack", {
    id: "evt-failed",
    event: "charge.failed",
    data: { reference: "GIG-FAILED", status: "failed" },
  }).status, "failed");
});
