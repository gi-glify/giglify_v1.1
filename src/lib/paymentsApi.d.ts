import { PaymentMethod, PaymentVerificationStatus } from './paymentTypes';
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
}): Promise<{
    depositId: string;
    payoutAccountId: string;
    amountUsd: number;
    amountKes: number;
    status: string;
    checkoutUrl?: string;
    clientSecret?: string;
}>;
export declare function createPayoutRequest(input: {
    amount: number;
    payoutAccountId: string;
}): Promise<{
    id: string;
    status: string;
}>;
export declare function fetchPaymentVerificationState(userId: string): Promise<PaymentVerificationState>;
//# sourceMappingURL=paymentsApi.d.ts.map