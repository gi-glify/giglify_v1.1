import assert from "node:assert/strict";
import test from "node:test";
import { LAUNCH_OFFERS, shouldShowLaunchOfferModal } from "../src/lib/launchOffers.ts";

test("launch offer modal uses the approved package prices and savings", () => {
  assert.deepEqual(LAUNCH_OFFERS.map((offer) => [offer.tier, offer.regularPriceUsd, offer.offerPriceUsd, offer.savingsUsd]), [
    ["Pro", 19, 5, 14],
    ["Elite", 49, 7, 42],
    ["Max", 99, 15, 84],
  ]);
});

test("launch offer modal returns after its seven-day dismissal window", () => {
  const now = Date.parse("2026-10-16T12:00:00.000Z");
  assert.equal(shouldShowLaunchOfferModal(null, now), true);
  assert.equal(shouldShowLaunchOfferModal(String(now - 2 * 24 * 60 * 60 * 1000), now), false);
  assert.equal(shouldShowLaunchOfferModal(String(now - 7 * 24 * 60 * 60 * 1000), now), true);
  assert.equal(shouldShowLaunchOfferModal("not-a-date", now), true);
});
