import test from 'node:test';
import assert from 'node:assert/strict';
import {
  KENYA_USD_RATE,
  VERIFICATION_KES,
  VERIFICATION_USD,
  isPaymentMethod,
} from '../src/lib/paymentConstants.ts';

test('uses the fixed Kenya verification deposit amount', () => {
  assert.equal(VERIFICATION_USD, 3);
  assert.equal(KENYA_USD_RATE, 124.5);
  assert.equal(VERIFICATION_KES, 373.5);
});

test('accepts only supported payment methods', () => {
  assert.equal(isPaymentMethod('mpesa'), true);
  assert.equal(isPaymentMethod('paypal'), true);
  assert.equal(isPaymentMethod('stripe'), true);
  assert.equal(isPaymentMethod('cash'), false);
});
