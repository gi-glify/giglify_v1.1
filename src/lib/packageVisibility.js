export function summarizePackageVisibility(row, tasksUsed) {
    const used = Math.max(0, tasksUsed);
    return { tier: row.tier, tasksAllowed: row.tasks_allowed, tasksUsed: used, tasksRemaining: row.tasks_allowed === null ? null : Math.max(0, row.tasks_allowed - used), highPayingEligible: row.high_paying_eligible, activationAt: row.activation_at, renewalAt: row.renewal_at };
}
//# sourceMappingURL=packageVisibility.js.map