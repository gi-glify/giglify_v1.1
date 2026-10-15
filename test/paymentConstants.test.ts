import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KENYA_USD_RATE,
  VERIFICATION_KES,
  VERIFICATION_USD,
  isPaymentMethod,
} from '../src/lib/paymentConstants.ts';

test('uses the fixed Kenya verification deposit amount', () => {
  assert.equal(VERIFICATION_USD, 5);
  assert.equal(KENYA_USD_RATE, 131);
  assert.equal(VERIFICATION_KES, 655);
});

test('accepts only supported payment methods', () => {
  assert.equal(isPaymentMethod('mpesa'), true);
  assert.equal(isPaymentMethod('paystack'), true);
  assert.equal(isPaymentMethod('paypal'), true);
  assert.equal(isPaymentMethod('palpluss'), false);
  assert.equal(isPaymentMethod('stripe'), false);
  assert.equal(isPaymentMethod('cash'), false);
});
