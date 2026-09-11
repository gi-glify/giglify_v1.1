export const APPROVED_PAYMENT_PROVIDERS = ["palpluss", "paystack", "paypal"];
export const TRANSACTION_STATUSES = [
    "created",
    "pending",
    "processing",
    "success",
    "failed",
    "cancelled",
    "verification_required",
    "expired",
];
export const PACKAGE_PLANS = {
    free: { priceUsd: 0, validityMonths: null, tasksAllowed: 5, highPayingEligible: false },
    pro: { priceUsd: 45, validityMonths: 3, tasksAllowed: 50, highPayingEligible: true },
    elite: { priceUsd: 120, validityMonths: 3, tasksAllowed: null, highPayingEligible: true },
};
export function isHighPayingReward(reward) {
    return Number.isFinite(reward) && reward > 5;
}
export function canChangePackage(currentTier) {
    return currentTier === "free";
}
export function calculatePackageEndDate(start, tier) {
    const validityMonths = PACKAGE_PLANS[tier].validityMonths;
    if (validityMonths === null)
        return null;
    const end = new Date(start.getTime());
    end.setUTCMonth(end.getUTCMonth() + validityMonths);
    return end;
}
//# sourceMappingURL=packageRules.js.map