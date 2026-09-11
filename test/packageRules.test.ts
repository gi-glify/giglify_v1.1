import test from "node:test";
import assert from "node:assert/strict";
import {
  PACKAGE_PLANS,
  calculatePackageEndDate,
  canChangePackage,
  isHighPayingReward,
} from "../src/lib/packageRules.ts";

test("uses the approved package prices and periods", () => {
  assert.deepEqual(PACKAGE_PLANS, {
    free: { priceUsd: 0, validityMonths: null, tasksAllowed: 5, highPayingEligible: false },
    pro: { priceUsd: 45, validityMonths: 3, tasksAllowed: 50, highPayingEligible: true },
    elite: { priceUsd: 120, validityMonths: 3, tasksAllowed: null, highPayingEligible: true },
  });
});

test("treats rewards above five dollars as high-paying", () => {
  assert.equal(isHighPayingReward(5), false);
  assert.equal(isHighPayingReward(5.01), true);
});

test("only Free can change while active", () => {
  assert.equal(canChangePackage("free"), true);
  assert.equal(canChangePackage("pro"), false);
  assert.equal(canChangePackage("elite"), false);
});

test("Free has no end date and paid packages end three calendar months later", () => {
  const start = new Date("2026-01-31T12:00:00.000Z");
  assert.equal(calculatePackageEndDate(start, "free"), null);
  assert.equal(calculatePackageEndDate(start, "pro")?.toISOString(), "2026-05-01T12:00:00.000Z");
  assert.equal(calculatePackageEndDate(start, "elite")?.toISOString(), "2026-05-01T12:00:00.000Z");
});
