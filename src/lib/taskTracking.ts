export type TaskSubmissionStatus = 'in-progress' | 'submitted' | 'approved' | 'rejected';

export interface TaskSubmissionProgress {
  id: string;
  taskId: string;
  status: TaskSubmissionStatus;
  startedAt: string;
  completedAt: string | null;
  submittedContent: unknown;
  rewardPaid: number | null;
  rewardApproved: number | null;
  task: {
    taskCode: string | null;
    title: string;
    category: string;
    reward: number;
  } | null;
}

export interface TaskTrackingSummary {
  total: number;
  started: number;
  underReview: number;
  completed: number;
  needsAttention: number;
}

const STATUS_META: Record<TaskSubmissionStatus, { label: string; className: string; description: string }> = {
  'in-progress': {
    label: 'Started',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    description: 'You have started this task and can continue where you left off.',
  },
  submitted: {
    label: 'Under review',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    description: 'Your answers have been sent and are waiting for review.',
  },
  approved: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    description: 'This task was approved and your reward is recorded.',
  },
  rejected: {
    label: 'Needs attention',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    description: 'This submission was not approved. You can review the task and try again.',
  },
};

export function getTaskStatusMeta(status: string) {
  return STATUS_META[status as TaskSubmissionStatus] ?? {
    label: 'Unknown',
    className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    description: 'This task has an unrecognised status.',
  };
}

export function summarizeTaskSubmissions(submissions: Array<{ status: string }>): TaskTrackingSummary {
  return submissions.reduce<TaskTrackingSummary>((summary, submission) => {
    summary.total += 1;
    if (submission.status === 'in-progress') summary.started += 1;
    if (submission.status === 'submitted') summary.underReview += 1;
    if (submission.status === 'approved') summary.completed += 1;
    if (submission.status === 'rejected') summary.needsAttention += 1;
    return summary;
  }, { total: 0, started: 0, underReview: 0, completed: 0, needsAttention: 0 });
}
