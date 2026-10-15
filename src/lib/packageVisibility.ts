export type PackageVisibilityRow = {
  tier: string;
  tasks_allowed: number | null;
  daily_tasks_allowed: number | null;
  weekly_tasks_allowed: number | null;
  max_task_reward_usd: number | null;
  high_paying_eligible: boolean;
  activation_at: string;
  renewal_at: string | null;
  usage_period_start: string;
};

export type PackageVisibility = {
  tier: string;
  tasksAllowed: number | null;
  tasksUsed: number;
  tasksRemaining: number | null;
  dailyTasksAllowed: number | null;
  weeklyTasksAllowed: number | null;
  tasksUsedToday: number;
  tasksUsedThisWeek: number;
  maxTaskRewardUsd: number | null;
  highPayingEligible: boolean;
  activationAt: string;
  renewalAt: string | null;
};

export function summarizePackageVisibility(row: PackageVisibilityRow, tasksUsed: number, tasksUsedToday = 0, tasksUsedThisWeek = 0): PackageVisibility {
  const used = Math.max(0, tasksUsed);
  return {
    tier: row.tier,
    tasksAllowed: row.tasks_allowed,
    tasksUsed: used,
    tasksRemaining: row.tasks_allowed === null ? null : Math.max(0, row.tasks_allowed - used),
    dailyTasksAllowed: row.daily_tasks_allowed,
    weeklyTasksAllowed: row.weekly_tasks_allowed,
    tasksUsedToday: Math.max(0, tasksUsedToday),
    tasksUsedThisWeek: Math.max(0, tasksUsedThisWeek),
    maxTaskRewardUsd: row.max_task_reward_usd,
    highPayingEligible: row.high_paying_eligible,
    activationAt: row.activation_at,
    renewalAt: row.renewal_at,
  };
}
