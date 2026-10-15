import test from "node:test";
import assert from "node:assert/strict";
import {
  PACKAGE_PLANS,
  calculatePackageEndDate,
  canChangePackage,
  getPackagePayablePrice,
  isHighPayingReward,
} from "../src/lib/packageRules.ts";

test("uses the approved package prices and periods", () => {
  assert.deepEqual(PACKAGE_PLANS, {
    free: { priceUsd: 0, offerPriceUsd: null, validityMonths: null, tasksAllowed: 4, dailyTasksAllowed: 1, weeklyTasksAllowed: 1, maxTaskRewardUsd: 4.99, highPayingEligible: false },
    pro: { priceUsd: 19, offerPriceUsd: 3, validityMonths: 1, tasksAllowed: 30, dailyTasksAllowed: 1, weeklyTasksAllowed: null, maxTaskRewardUsd: 9.9, highPayingEligible: true },
    elite: { priceUsd: 49, offerPriceUsd: 7, validityMonths: 1, tasksAllowed: 90, dailyTasksAllowed: 3, weeklyTasksAllowed: null, maxTaskRewardUsd: 20, highPayingEligible: true },
    max: { priceUsd: 99, offerPriceUsd: 10, validityMonths: 1, tasksAllowed: null, dailyTasksAllowed: null, weeklyTasksAllowed: null, maxTaskRewardUsd: null, highPayingEligible: true },
  });
});

test("uses the one-time offer only while the user is eligible", () => {
  assert.equal(getPackagePayablePrice("pro", true), 3);
  assert.equal(getPackagePayablePrice("elite", true), 7);
  assert.equal(getPackagePayablePrice("max", true), 10);
  assert.equal(getPackagePayablePrice("pro", false), 19);
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

test("Free has no end date and paid packages end one calendar month later", () => {
  const start = new Date("2026-01-31T12:00:00.000Z");
  assert.equal(calculatePackageEndDate(start, "free"), null);
  assert.equal(calculatePackageEndDate(start, "pro")?.toISOString(), "2026-03-03T12:00:00.000Z");
  assert.equal(calculatePackageEndDate(start, "elite")?.toISOString(), "2026-03-03T12:00:00.000Z");
  assert.equal(calculatePackageEndDate(start, "max")?.toISOString(), "2026-03-03T12:00:00.000Z");
});
