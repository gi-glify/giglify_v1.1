import test from 'node:test';
import assert from 'node:assert/strict';
import { TERMS_OF_USE_SECTIONS } from '../src/pages/termsOfUseContent.ts';

test('public terms cover core worker, requester, payment, and account rules', () => {
  const titles = TERMS_OF_USE_SECTIONS.map((section) => section.title);
  for (const required of ['Accounts and eligibility', 'Worker tasks and submissions', 'Requester tasks', 'Payments and rewards', 'Suspension and termination', 'Changes to these terms']) {
    assert.ok(titles.includes(required), `missing terms section: ${required}`);
  }
});
