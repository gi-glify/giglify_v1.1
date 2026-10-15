export function summarizePackageVisibility(row, tasksUsed, tasksUsedToday = 0, tasksUsedThisWeek = 0) {
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
//# sourceMappingURL=packageVisibility.js.map
