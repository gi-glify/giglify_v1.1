import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAuthCallbackPath,
  getEmailRedirectUrl,
  normalizeMcqAnswer,
} from '../src/utils/authFlows.ts';

test('sends signup confirmation back to the current app origin', () => {
  assert.equal(
    getEmailRedirectUrl('https://giglify.co.ke', '/dashboard'),
    'https://giglify.co.ke/dashboard',
  );
});

test('routes signup hash callbacks to the dashboard', () => {
  assert.equal(
    getAuthCallbackPath('', '#access_token=token&type=signup'),
    '/dashboard',
  );
});

test('routes password recovery callbacks to the reset screen', () => {
  assert.equal(
    getAuthCallbackPath('?reset=1', '#access_token=token&type=recovery'),
    '/auth?reset=1',
  );
});

test('normalizes MCQ answers before validation', () => {
  assert.equal(normalizeMcqAnswer(' b '), 'B');
});
