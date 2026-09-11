export const VERIFICATION_PAYMENT_PROVIDERS = ['mpesa', 'paystack', 'paypal'] as const;
export type VerificationPaymentProvider = (typeof VERIFICATION_PAYMENT_PROVIDERS)[number];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9 ()-]{8,24}$/;

export type VerificationPaymentRequest = {
  method: VerificationPaymentProvider;
  accountLabel: string;
  accountValue: string;
  email?: string;
  phone?: string;
};

export function parseVerificationPaymentRequest(input: unknown): VerificationPaymentRequest | null {
  if (!input || typeof input !== 'object') return null;
  const body = input as Record<string, unknown>;
  const method = body.method;
  const accountLabel = typeof body.accountLabel === 'string' ? body.accountLabel.trim() : '';
  const accountValue = typeof body.accountValue === 'string' ? body.accountValue.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : undefined;
  const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined;

  if (!VERIFICATION_PAYMENT_PROVIDERS.includes(method as VerificationPaymentProvider) || !accountLabel || !accountValue) return null;
  if ((method === 'paystack' || method === 'paypal') && (!email || !EMAIL_PATTERN.test(email))) return null;
  if (method === 'mpesa' && (!phone || !PHONE_PATTERN.test(phone))) return null;

  return {
    method: method as VerificationPaymentProvider,
    accountLabel,
    accountValue,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
  };
}
