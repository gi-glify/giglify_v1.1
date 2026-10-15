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
export declare function summarizePackageVisibility(row: PackageVisibilityRow, tasksUsed: number, tasksUsedToday?: number, tasksUsedThisWeek?: number): PackageVisibility;
//# sourceMappingURL=packageVisibility.d.ts.map