export declare const LAUNCH_OFFERS: readonly [{
    readonly tier: "Pro";
    readonly regularPriceUsd: 19;
    readonly offerPriceUsd: 5;
    readonly savingsUsd: 14;
    readonly detail: "30 tasks/month · up to $9.90 tasks";
}, {
    readonly tier: "Elite";
    readonly regularPriceUsd: 49;
    readonly offerPriceUsd: 7;
    readonly savingsUsd: 42;
    readonly detail: "90 tasks/month · up to $20 tasks";
}, {
    readonly tier: "Max";
    readonly regularPriceUsd: 99;
    readonly offerPriceUsd: 15;
    readonly savingsUsd: 84;
    readonly detail: "All tasks · no monthly limit";
}];
export declare const LAUNCH_OFFER_DISMISSAL_KEY = "giglify-launch-offer-dismissed-at";
export declare const LAUNCH_OFFER_DISMISSAL_WINDOW_MS: number;
export declare function shouldShowLaunchOfferModal(storedValue: string | null, now?: number): boolean;
//# sourceMappingURL=launchOffers.d.ts.map