export type PackageTier = "free" | "pro" | "elite" | "max";
export const APPROVED_PAYMENT_PROVIDERS = ["mpesa", "paystack", "paypal"] as const;
export const TRANSACTION_STATUSES = [
  "created",
  "pending",
  "processing",
  "success",
  "failed",
  "cancelled",
  "verification_required",
  "expired",
] as const;

export const PACKAGE_PLANS: Record<PackageTier, {
  priceUsd: number;
  validityMonths: number | null;
  tasksAllowed: number | null;
  highPayingEligible: boolean;
  dailyTasksAllowed: number | null;
  weeklyTasksAllowed: number | null;
  maxTaskRewardUsd: number | null;
}> = {
  free: { priceUsd: 0, validityMonths: null, tasksAllowed: 4, dailyTasksAllowed: 1, weeklyTasksAllowed: 1, maxTaskRewardUsd: 4.99, highPayingEligible: false },
  pro: { priceUsd: 19, validityMonths: 1, tasksAllowed: 30, dailyTasksAllowed: 1, weeklyTasksAllowed: null, maxTaskRewardUsd: 9.9, highPayingEligible: true },
  elite: { priceUsd: 49, validityMonths: 1, tasksAllowed: 90, dailyTasksAllowed: 3, weeklyTasksAllowed: null, maxTaskRewardUsd: 20, highPayingEligible: true },
  max: { priceUsd: 99, validityMonths: 1, tasksAllowed: null, dailyTasksAllowed: null, weeklyTasksAllowed: null, maxTaskRewardUsd: null, highPayingEligible: true },
};

export function isHighPayingReward(reward: number): boolean {
  return Number.isFinite(reward) && reward > 5;
}

export function canChangePackage(currentTier: PackageTier): boolean {
  return currentTier === "free";
}

export function calculatePackageEndDate(start: Date, tier: PackageTier): Date | null {
  const validityMonths = PACKAGE_PLANS[tier].validityMonths;
  if (validityMonths === null) return null;

  const end = new Date(start.getTime());
  end.setUTCMonth(end.getUTCMonth() + validityMonths);
  return end;
}
