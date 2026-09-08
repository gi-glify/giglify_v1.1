import test from 'node:test';
import assert from 'node:assert/strict';
import { trackPageView } from '../src/utils/analytics.ts';

test('tracks the current SPA route as a Google Analytics page view', () => {
  const calls: unknown[][] = [];
  const originalWindow = globalThis.window;

  globalThis.window = {
    gtag: (...args: unknown[]) => calls.push(args),
  } as unknown as Window & typeof globalThis;

  try {
    trackPageView('/tasks');
    assert.deepEqual(calls, [[
      'event',
      'page_view',
      { page_path: '/tasks', page_location: 'https://giglify.co.ke/tasks' },
    ]]);
  } finally {
    globalThis.window = originalWindow;
  }
});
