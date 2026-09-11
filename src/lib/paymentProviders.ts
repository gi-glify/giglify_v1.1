export type PaymentProviderId = 'paystack' | 'paypal' | 'mpesa';

export type ProviderInput = {
  email?: string;
  phone?: string;
};

export const PAYMENT_PROVIDERS = [
  { id: 'paystack', label: 'Paystack' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'mpesa', label: 'M-Pesa' },
] as const satisfies ReadonlyArray<{ id: PaymentProviderId; label: string }>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{8,24}$/;

export function getProviderField(provider: PaymentProviderId) {
  return provider === 'mpesa'
    ? { name: 'phone' as const, label: 'M-Pesa phone number', placeholder: '+254 7XX XXX XXX', autoComplete: 'tel' }
    : { name: 'email' as const, label: `${provider === 'paypal' ? 'PayPal' : 'Paystack'} email address`, placeholder: 'email@example.com', autoComplete: 'email' };
}

export function getCheckoutLabel(provider: PaymentProviderId): string {
  if (provider === 'mpesa') return 'M-Pesa STK prompt started';
  if (provider === 'paypal') return 'Continue to PayPal approval';
  return 'Continue to Paystack checkout';
}

export function validateProviderInput(provider: PaymentProviderId, input: ProviderInput): string | null {
  if (provider === 'mpesa') {
    return input.phone && PHONE_PATTERN.test(input.phone.trim())
      ? null
      : 'Enter a valid phone number for the M-Pesa STK prompt.';
  }
  const label = provider === 'paypal' ? 'PayPal' : 'Paystack';
  return input.email && EMAIL_PATTERN.test(input.email.trim())
    ? null
    : `Enter a valid email address for ${label} checkout.`;
}
