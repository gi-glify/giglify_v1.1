import { PACKAGE_PLANS, type PackageTier } from "./packageRules.js";

export type PaidPackageTier = Exclude<PackageTier, "free">;

export function getPackageDisplay(tier: PaidPackageTier) {
  const plan = PACKAGE_PLANS[tier];
  return {
    name: tier === "pro" ? "Pro" : "Elite",
    priceUsd: plan.priceUsd,
    validityLabel: `${plan.validityMonths} months`,
  };
}

export function createPackageIdempotencyKey(tier: PaidPackageTier, nonce = crypto.randomUUID()): string {
  return `package-${tier}-${nonce}`;
}
