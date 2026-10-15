export const LAUNCH_OFFERS = [
  { tier: "Pro", regularPriceUsd: 19, offerPriceUsd: 5, savingsUsd: 14, detail: "30 tasks/month · up to $9.90 tasks" },
  { tier: "Elite", regularPriceUsd: 49, offerPriceUsd: 7, savingsUsd: 42, detail: "90 tasks/month · up to $20 tasks" },
  { tier: "Max", regularPriceUsd: 99, offerPriceUsd: 15, savingsUsd: 84, detail: "All tasks · no monthly limit" },
] as const;

export const LAUNCH_OFFER_DISMISSAL_KEY = "giglify-launch-offer-dashboard-dismissed-at";
export const LAUNCH_OFFER_DISABLED_KEY = "giglify-launch-offer-dashboard-disabled";
export const LAUNCH_OFFER_DISMISSAL_WINDOW_MS = 2 * 60 * 60 * 1000;

export function shouldShowLaunchOfferModal(storedValue: string | null, now = Date.now(), disabled = false): boolean {
  if (disabled) return false;
  if (!storedValue) return true;
  const dismissedAt = Number(storedValue);
  return !Number.isFinite(dismissedAt) || now - dismissedAt >= LAUNCH_OFFER_DISMISSAL_WINDOW_MS;
}
