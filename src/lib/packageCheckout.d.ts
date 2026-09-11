import { type PackageTier } from "./packageRules.js";
export type PaidPackageTier = Exclude<PackageTier, "free">;
export declare function getPackageDisplay(tier: PaidPackageTier): {
    name: string;
    priceUsd: number;
    validityLabel: string;
};
export declare function createPackageIdempotencyKey(tier: PaidPackageTier, nonce?: `${string}-${string}-${string}-${string}-${string}`): string;
//# sourceMappingURL=packageCheckout.d.ts.map