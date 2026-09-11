export type PaymentProviderId = 'paystack' | 'paypal' | 'mpesa';
export type ProviderInput = {
    email?: string;
    phone?: string;
};
export declare const PAYMENT_PROVIDERS: readonly [{
    readonly id: "paystack";
    readonly label: "Paystack";
}, {
    readonly id: "paypal";
    readonly label: "PayPal";
}, {
    readonly id: "mpesa";
    readonly label: "M-Pesa";
}];
export declare function getProviderField(provider: PaymentProviderId): {
    name: "phone";
    label: string;
    placeholder: string;
    autoComplete: string;
} | {
    name: "email";
    label: string;
    placeholder: string;
    autoComplete: string;
};
export declare function getCheckoutLabel(provider: PaymentProviderId): string;
export declare function validateProviderInput(provider: PaymentProviderId, input: ProviderInput): string | null;
//# sourceMappingURL=paymentProviders.d.ts.map