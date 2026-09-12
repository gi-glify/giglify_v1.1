import type { PaymentMethod } from './paymentTypes';

export type PayoutProviderStatus = 'ready' | 'provider_not_configured' | 'under_review';

// STK/checkout credentials do not imply that a payout API is configured.
// Keep this explicit until a provider payout endpoint and callback contract exist.
export function getPayoutProviderStatus(_method: PaymentMethod): PayoutProviderStatus {
  return 'provider_not_configured';
}
