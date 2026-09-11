export type PackageTier = "free" | "pro" | "elite";
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
}> = {
  free: { priceUsd: 0, validityMonths: null, tasksAllowed: 5, highPayingEligible: false },
  pro: { priceUsd: 45, validityMonths: 3, tasksAllowed: 50, highPayingEligible: true },
  elite: { priceUsd: 120, validityMonths: 3, tasksAllowed: null, highPayingEligible: true },
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
