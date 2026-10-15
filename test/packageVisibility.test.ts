import test from "node:test";
import assert from "node:assert/strict";
import { summarizePackageVisibility } from "../src/lib/packageVisibility.ts";

test("summarizes a Free entitlement without renewal and with remaining allowance", () => {
  assert.deepEqual(summarizePackageVisibility({ tier: "free", tasks_allowed: 4, daily_tasks_allowed: 1, weekly_tasks_allowed: 1, max_task_reward_usd: 4.99, high_paying_eligible: false, activation_at: "2026-09-01", renewal_at: null, usage_period_start: "2026-09-01" }, 2, 1, 1), {
    tier: "free", tasksAllowed: 4, tasksUsed: 2, tasksRemaining: 2, dailyTasksAllowed: 1, weeklyTasksAllowed: 1, tasksUsedToday: 1, tasksUsedThisWeek: 1, maxTaskRewardUsd: 4.99, highPayingEligible: false, activationAt: "2026-09-01", renewalAt: null,
  });
});

test("clamps paid usage and never produces negative remaining allowance", () => {
  const result = summarizePackageVisibility({ tier: "elite", tasks_allowed: 90, daily_tasks_allowed: 3, weekly_tasks_allowed: null, max_task_reward_usd: 20, high_paying_eligible: true, activation_at: "2026-09-01", renewal_at: "2026-10-01", usage_period_start: "2026-09-01" }, 999);
  assert.equal(result.tasksRemaining, 0);
  assert.equal(result.highPayingEligible, true);
  assert.equal(result.renewalAt, "2026-10-01");
});
