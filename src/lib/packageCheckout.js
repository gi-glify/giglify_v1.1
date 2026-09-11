import { PACKAGE_PLANS } from "./packageRules.js";
export function getPackageDisplay(tier) {
    const plan = PACKAGE_PLANS[tier];
    return {
        name: tier === "pro" ? "Pro" : "Elite",
        priceUsd: plan.priceUsd,
        validityLabel: `${plan.validityMonths} months`,
    };
}
export function createPackageIdempotencyKey(tier, nonce = crypto.randomUUID()) {
    return `package-${tier}-${nonce}`;
}
//# sourceMappingURL=packageCheckout.js.map