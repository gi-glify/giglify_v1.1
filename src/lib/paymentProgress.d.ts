import type { PaymentMethod } from './paymentTypes';
export type PaymentProgressKind = 'package' | 'verification';
export type PaymentProgressPhase = 'starting' | 'awaiting_confirmation' | 'review' | 'complete' | 'failed' | 'cancelled';
export type PaymentProgress = {
    phase: PaymentProgressPhase;
    label: string;
    description: string;
    terminal: boolean;
    canRetry: boolean;
};
export declare function isPaymentProgressTerminal(status: string | null | undefined): boolean;
export declare function getPaymentProgress(status: string | null | undefined, kind: PaymentProgressKind, provider: PaymentMethod): PaymentProgress;
//# sourceMappingURL=paymentProgress.d.ts.map