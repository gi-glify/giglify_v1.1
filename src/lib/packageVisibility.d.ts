export type PackageVisibilityRow = {
    tier: string;
    tasks_allowed: number | null;
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
    highPayingEligible: boolean;
    activationAt: string;
    renewalAt: string | null;
};
export declare function summarizePackageVisibility(row: PackageVisibilityRow, tasksUsed: number): PackageVisibility;
//# sourceMappingURL=packageVisibility.d.ts.map