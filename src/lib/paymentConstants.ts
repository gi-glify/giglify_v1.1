import type { PaymentMethod } from './paymentTypes';

export const VERIFICATION_USD = 3;
export const KENYA_USD_RATE = 124.5;
export const VERIFICATION_KES = VERIFICATION_USD * KENYA_USD_RATE;

const PAYMENT_METHODS: readonly PaymentMethod[] = ['mpesa', 'paypal', 'stripe'];

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && PAYMENT_METHODS.includes(value as PaymentMethod);
}
