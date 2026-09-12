import type { PaymentProviderId } from '../components/ui/PaymentProviderTabs';
import type { PaidPackageTier } from './packageCheckout';
export type PaymentDraftFlow = 'package' | 'verification';
export type PaymentDraftStep = 'details' | 'provider' | 'payment' | 'result';
export type PaymentIntent = 'packages' | 'verification' | 'auto';
export type PaymentDraft = {
    flow: PaymentDraftFlow;
    tier?: PaidPackageTier;
    provider?: PaymentProviderId;
    accountLabel?: string;
    email?: string;
    phone?: string;
    step: PaymentDraftStep;
};
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export declare function readPaymentDraft(flow: PaymentDraftFlow, storage?: StorageLike): PaymentDraft | null;
export declare function writePaymentDraft(flow: PaymentDraftFlow, draft: PaymentDraft, storage?: StorageLike): void;
export declare function clearPaymentDraft(flow: PaymentDraftFlow, storage?: StorageLike): void;
export declare function parsePaymentIntent(search: string, state: unknown): PaymentIntent;
export declare function readPaymentViewPreference(storage?: StorageLike): PaymentIntent;
export declare function writePaymentViewPreference(view: Exclude<PaymentIntent, 'auto'>, storage?: StorageLike): void;
export {};
//# sourceMappingURL=paymentDraft.d.ts.map