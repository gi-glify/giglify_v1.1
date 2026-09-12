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

export function summarizePackageVisibility(row: PackageVisibilityRow, tasksUsed: number): PackageVisibility {
  const used = Math.max(0, tasksUsed);
  return { tier: row.tier, tasksAllowed: row.tasks_allowed, tasksUsed: used, tasksRemaining: row.tasks_allowed === null ? null : Math.max(0, row.tasks_allowed - used), highPayingEligible: row.high_paying_eligible, activationAt: row.activation_at, renewalAt: row.renewal_at };
}
