import type { PaymentMethod } from './paymentTypes';
export type PayoutProviderStatus = 'ready' | 'provider_not_configured' | 'under_review';
export declare function getPayoutProviderStatus(_method: PaymentMethod): PayoutProviderStatus;
//# sourceMappingURL=payoutProviders.d.ts.map