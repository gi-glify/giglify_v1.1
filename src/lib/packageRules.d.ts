export type PackageTier = "free" | "pro" | "elite";
export declare const APPROVED_PAYMENT_PROVIDERS: readonly ["palpluss", "paystack", "paypal"];
export declare const TRANSACTION_STATUSES: readonly ["created", "pending", "processing", "success", "failed", "cancelled", "verification_required", "expired"];
export declare const PACKAGE_PLANS: Record<PackageTier, {
    priceUsd: number;
    validityMonths: number | null;
    tasksAllowed: number | null;
    highPayingEligible: boolean;
}>;
export declare function isHighPayingReward(reward: number): boolean;
export declare function canChangePackage(currentTier: PackageTier): boolean;
export declare function calculatePackageEndDate(start: Date, tier: PackageTier): Date | null;
//# sourceMappingURL=packageRules.d.ts.map