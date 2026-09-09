import test from 'node:test';
import assert from 'node:assert/strict';
import { SOCIAL_PROVIDERS, getSocialProvider } from '../src/utils/socialAuth.ts';

test('defines the three supported social login providers', () => {
  assert.deepEqual(SOCIAL_PROVIDERS.map((provider) => provider.id), ['google', 'facebook', 'github']);
  assert.equal(getSocialProvider('github')?.label, 'GitHub');
  assert.equal(getSocialProvider('facebook')?.label, 'Facebook');
});

test('returns no provider for unsupported social login identifiers', () => {
  assert.equal(getSocialProvider('linkedin'), undefined);
});
