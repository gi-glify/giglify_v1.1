import test from "node:test";
import assert from "node:assert/strict";
import { summarizePackageVisibility } from "../src/lib/packageVisibility.ts";

test("summarizes a Free entitlement without renewal and with remaining allowance", () => {
  assert.deepEqual(summarizePackageVisibility({ tier: "free", tasks_allowed: 5, high_paying_eligible: false, activation_at: "2026-09-01", renewal_at: null, usage_period_start: "2026-09-01" }, 2), {
    tier: "free", tasksAllowed: 5, tasksUsed: 2, tasksRemaining: 3, highPayingEligible: false, activationAt: "2026-09-01", renewalAt: null,
  });
});

test("summarizes unlimited paid access and never produces negative usage", () => {
  const result = summarizePackageVisibility({ tier: "elite", tasks_allowed: null, high_paying_eligible: true, activation_at: "2026-09-01", renewal_at: "2026-12-01", usage_period_start: "2026-09-01" }, 999);
  assert.equal(result.tasksRemaining, null);
  assert.equal(result.highPayingEligible, true);
  assert.equal(result.renewalAt, "2026-12-01");
});
