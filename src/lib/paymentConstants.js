export const VERIFICATION_USD = 3;
export const KENYA_USD_RATE = 124.5;
export const VERIFICATION_KES = VERIFICATION_USD * KENYA_USD_RATE;
const PAYMENT_METHODS = ['mpesa', 'paypal', 'stripe'];
export function isPaymentMethod(value) {
    return typeof value === 'string' && PAYMENT_METHODS.includes(value);
}
//# sourceMappingURL=paymentConstants.js.map