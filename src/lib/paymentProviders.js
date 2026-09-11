export const PAYMENT_PROVIDERS = [
    { id: 'paystack', label: 'Paystack' },
    { id: 'paypal', label: 'PayPal' },
    { id: 'palpluss', label: 'PalPluss' },
];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{8,24}$/;
export function getProviderField(provider) {
    return provider === 'palpluss'
        ? { name: 'phone', label: 'PalPluss phone number', placeholder: '+254 7XX XXX XXX', autoComplete: 'tel' }
        : { name: 'email', label: `${provider === 'paypal' ? 'PayPal' : 'Paystack'} email address`, placeholder: 'email@example.com', autoComplete: 'email' };
}
export function getCheckoutLabel(provider) {
    if (provider === 'palpluss')
        return 'STK prompt started';
    if (provider === 'paypal')
        return 'Continue to PayPal approval';
    return 'Continue to Paystack checkout';
}
export function validateProviderInput(provider, input) {
    if (provider === 'palpluss') {
        return input.phone && PHONE_PATTERN.test(input.phone.trim())
            ? null
            : 'Enter a valid phone number for the PalPluss STK prompt.';
    }
    const label = provider === 'paypal' ? 'PayPal' : 'Paystack';
    return input.email && EMAIL_PATTERN.test(input.email.trim())
        ? null
        : `Enter a valid email address for ${label} checkout.`;
}
//# sourceMappingURL=paymentProviders.js.map