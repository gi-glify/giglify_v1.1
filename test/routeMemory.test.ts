import test from 'node:test';
import assert from 'node:assert/strict';
import { isRestorableRoute } from '../src/utils/routeMemory.ts';

test('only authenticated application routes are restored', () => {
  assert.equal(isRestorableRoute('/tasks'), true);
  assert.equal(isRestorableRoute('/tasks/TSK-001'), true);
  assert.equal(isRestorableRoute('/dashboard'), true);
  assert.equal(isRestorableRoute('/'), false);
  assert.equal(isRestorableRoute('/auth'), false);
});
