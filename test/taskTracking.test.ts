import test from 'node:test';
import assert from 'node:assert/strict';
import { getTaskStatusMeta, summarizeTaskSubmissions } from '../src/lib/taskTracking.ts';

test('summarizes task submissions by user-facing workflow status', () => {
  const summary = summarizeTaskSubmissions([
    { status: 'in-progress' },
    { status: 'submitted' },
    { status: 'approved' },
    { status: 'rejected' },
    { status: 'approved' },
  ]);

  assert.deepEqual(summary, {
    total: 5,
    started: 1,
    underReview: 1,
    completed: 2,
    needsAttention: 1,
  });
});

test('maps database statuses to clear labels and tone classes', () => {
  assert.equal(getTaskStatusMeta('in-progress').label, 'Started');
  assert.equal(getTaskStatusMeta('submitted').label, 'Under review');
  assert.equal(getTaskStatusMeta('approved').label, 'Completed');
  assert.equal(getTaskStatusMeta('rejected').label, 'Needs attention');
  assert.equal(getTaskStatusMeta('unknown').label, 'Unknown');
});
