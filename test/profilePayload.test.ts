import test from 'node:test';
import assert from 'node:assert/strict';
import { toProfilePayload } from '../src/utils/profilePayload.ts';

test('maps profile form fields to the database column names', () => {
  const payload = toProfilePayload({
    phone: '+254700000000',
    country: 'Kenya',
    bio: 'A sufficiently long profile biography.',
    skills: ['Research'],
    payoutMethodAdded: true,
    profilePicture: 'data:image/png;base64,abc',
    idType: 'Passport',
    idNumber: 'P123',
    dateOfBirth: '1990-01-01',
    address: 'Nairobi',
    fullLegalName: 'Test User',
    payoutMethod: 'mpesa',
    payoutAccount: '0712345678',
    proofOfPayment: 'data:image/png;base64,proof',
  });

  assert.equal(payload.payout_method_added, true);
  assert.equal(payload.profile_picture, 'data:image/png;base64,abc');
  assert.equal(payload.full_legal_name, 'Test User');
  assert.equal('payoutMethodAdded' in payload, false);
});
