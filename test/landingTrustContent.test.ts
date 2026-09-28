import test from 'node:test';
import assert from 'node:assert/strict';
import { LANDING_PARTNERS, LANDING_REVIEWS } from '../src/pages/landingTrustContent.ts';

test('landing trust content includes credible partners and customer reviews', () => {
  assert.equal(LANDING_PARTNERS.length, 2);
  assert.deepEqual(
    LANDING_PARTNERS.map((partner) => partner.name),
    ['Supabase', 'Stripe'],
  );
  assert.deepEqual(
    LANDING_PARTNERS.map((partner) => partner.icon),
    ['supabase', 'stripe'],
  );

  assert.equal(LANDING_REVIEWS.length, 3);
  assert.ok(
    LANDING_REVIEWS.some((review) => review.role.includes('Requester')),
    'missing requester review',
  );
  assert.ok(
    LANDING_REVIEWS.some((review) => review.role.includes('Tasker')),
    'missing tasker review',
  );
});
