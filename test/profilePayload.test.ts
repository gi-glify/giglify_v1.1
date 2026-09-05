import test from 'node:test';
import assert from 'node:assert/strict';
import { toProfilePayload } from '../src/utils/profilePayload.ts';

test('maps profile form fields to the database column names', () => {
  const payload = toProfilePayload({
    email: 'test@example.com',
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
    payoutMethod: 'mpesa',
    payoutAccount: '0712345678',
    proofOfPayment: 'data:image/png;base64,proof',
  });

  assert.equal(payload.payout_method_added, true);
  assert.equal(payload.profile_picture, 'data:image/png;base64,abc');
  assert.equal(payload.date_of_birth, '1990-01-01');
  assert.equal('payoutMethodAdded' in payload, false);
});

test('normalizes a browser-localized date before sending it to Postgres', () => {
  const payload = toProfilePayload({
    email: 'test@example.com',
    phone: '', country: '', bio: '', skills: [], payoutMethodAdded: false,
    profilePicture: '', idType: '', idNumber: '', dateOfBirth: '07/07/2005',
    address: '', payoutMethod: '', payoutAccount: '', proofOfPayment: '',
  });
  assert.equal(payload.date_of_birth, '2005-07-07');
});
