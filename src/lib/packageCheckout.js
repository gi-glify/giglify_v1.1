import { PACKAGE_PLANS } from "./packageRules.js";
export function getPackageDisplay(tier) {
    const plan = PACKAGE_PLANS[tier];
    return {
        name: tier === "pro" ? "Pro" : tier === "elite" ? "Elite" : "Max",
        priceUsd: plan.priceUsd,
        offerPriceUsd: plan.offerPriceUsd,
        validityLabel: `${plan.validityMonths} month`,
    };
}
export function createPackageIdempotencyKey(tier, nonce = crypto.randomUUID()) {
    return `package-${tier}-${nonce}`;
}
//# sourceMappingURL=packageCheckout.js.map