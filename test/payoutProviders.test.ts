import test from "node:test";
import assert from "node:assert/strict";
import { getPayoutProviderStatus } from "../src/lib/payoutProviders.ts";

test("does not claim payout execution until a provider payout contract is configured", () => {
  assert.equal(getPayoutProviderStatus("mpesa"), "provider_not_configured");
  assert.equal(getPayoutProviderStatus("paypal"), "provider_not_configured");
  assert.equal(getPayoutProviderStatus("paystack"), "provider_not_configured");
});
