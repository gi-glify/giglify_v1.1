import { PaymentMethod, PaymentVerificationStatus } from './paymentTypes';
import type { PaidPackageTier } from './packageCheckout';
import { type PackageVisibility } from './packageVisibility';
export type PackagePaymentProvider = 'mpesa' | 'paystack' | 'paypal';
export type PackagePaymentStart = {
    transactionId: string;
    tuid: string;
    paymentAttemptId?: string;
    tier: PaidPackageTier;
    amount: number;
    currency: string;
    provider: PackagePaymentProvider;
    status: string;
    checkoutUrl?: string;
    clientSecret?: string;
};
export type PaymentVerificationState = {
    status: PaymentVerificationStatus;
    verifiedAt: string | null;
    accounts: Array<{
        id: string;
        method: PaymentMethod;
        accountLabel: string;
        status: string;
        isPrimary: boolean;
    }>;
    latestDeposit: {
        id: string;
        status: string;
        amountUsd: number;
        amountKes: number;
    } | null;
};
export declare function createVerificationPayment(input: {
    method: PaymentMethod;
    accountLabel: string;
    accountValue: string;
    email?: string;
    phone?: string;
}): Promise<{
    depositId: string;
    payoutAccountId: string;
    amountUsd: number;
    amountKes: number;
    status: string;
    checkoutUrl?: string;
    clientSecret?: string;
}>;
export declare function createPackagePayment(input: {
    tier: PaidPackageTier;
    provider: PackagePaymentProvider;
    idempotencyKey: string;
}): Promise<PackagePaymentStart>;
export declare function startPackagePayment(input: {
    transactionId: string;
    email?: string;
    phone?: string;
}): Promise<PackagePaymentStart>;
export declare function fetchPackagePaymentStatus(transactionId: string): Promise<{
    status: string;
    provider: PackagePaymentProvider;
}>;
export declare function fetchVerificationPaymentStatus(depositId: string): Promise<{
    status: string;
    provider: PaymentMethod;
}>;
export declare function fetchPackageVisibility(userId: string): Promise<PackageVisibility | null>;
export declare function createPayoutRequest(input: {
    amount: number;
    payoutAccountId: string;
}): Promise<{
    id: string;
    status: string;
}>;
export declare function fetchPaymentVerificationState(userId: string): Promise<PaymentVerificationState>;
//# sourceMappingURL=paymentsApi.d.ts.map