import test from 'node:test';
import assert from 'node:assert/strict';
import { mapTaskRow } from '../src/lib/taskCatalog.ts';

test('maps an active database task into the shape rendered by the task catalog', () => {
  const task = mapTaskRow({
    id: 'task-1',
    task_code: 'TSK-001',
    title: 'Review answers',
    description: 'Check answer quality',
    category: 'data-verification',
    reward: '7.50',
    estimated_time_minutes: 25,
    difficulty: 'expert',
    device: 'desktop',
    requires_desktop: true,
    is_active: true,
  });

  assert.deepEqual(task, {
    id: 'task-1',
    taskCode: 'TSK-001',
    title: 'Review answers',
    description: 'Check answer quality',
    category: 'data-verification',
    reward: 7.5,
    estimatedTime: 25,
    difficulty: 'expert',
    device: 'desktop',
    requiresDesktop: true,
    status: 'available',
  });
});
