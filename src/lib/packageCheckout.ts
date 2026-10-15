import { PACKAGE_PLANS, type PackageTier } from "./packageRules.js";

export type PaidPackageTier = Exclude<PackageTier, "free">;

export function getPackageDisplay(tier: PaidPackageTier) {
  const plan = PACKAGE_PLANS[tier];
  return {
    name: tier === "pro" ? "Pro" : tier === "elite" ? "Elite" : "Max",
    priceUsd: plan.priceUsd,
    validityLabel: `${plan.validityMonths} month`,
  };
}

export function createPackageIdempotencyKey(tier: PaidPackageTier, nonce = crypto.randomUUID()): string {
  return `package-${tier}-${nonce}`;
}
