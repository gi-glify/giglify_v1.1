import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Eye, ListChecks, RotateCcw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { fetchTaskSubmissionProgress } from '../lib/taskQuestionsApi';
import { getTaskStatusMeta, summarizeTaskSubmissions, type TaskSubmissionProgress } from '../lib/taskTracking';

type Filter = 'all' | 'in-progress' | 'submitted' | 'approved' | 'rejected';

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All tasks' },
  { value: 'in-progress', label: 'Started' },
  { value: 'submitted', label: 'Under review' },
  { value: 'approved', label: 'Completed' },
  { value: 'rejected', label: 'Needs attention' },
];

function formatDate(value: string | null) {
  if (!value) return 'No date available';
  return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(value));
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof ListChecks; label: string; value: number; tone: string }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}><Icon size={19} /></div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

export default function TaskTrackingPage() {
  const user = useAuthStore((state) => state.user);
  const [submissions, setSubmissions] = useState<TaskSubmissionProgress[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    fetchTaskSubmissionProgress(user.id).then(({ submissions: rows, error: fetchError }) => {
      if (cancelled) return;
      setSubmissions(rows);
      setError(fetchError?.message ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  const summary = useMemo(() => summarizeTaskSubmissions(submissions), [submissions]);
  const visible = useMemo(
    () => filter === 'all' ? submissions : submissions.filter((submission) => submission.status === filter),
    [filter, submissions],
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main className="container py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6" data-aos="fade-down">
          <div>
            <h1 className="font-display text-2xl mb-1">My task progress</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Follow every task from your first answer to final review.</p>
          </div>
          <Link to="/tasks" className="btn-primary inline-flex items-center gap-2 text-sm"><ListChecks size={16} /> Find tasks</Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8" data-aos="fade-up">
          <Stat icon={ListChecks} label="All tracked tasks" value={summary.total} tone="bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300" />
          <Stat icon={Clock3} label="Started" value={summary.started} tone="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" />
          <Stat icon={Eye} label="Under review" value={summary.underReview} tone="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" />
          <Stat icon={CheckCircle2} label="Completed" value={summary.completed} tone="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-5" role="tablist" aria-label="Filter task progress">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => setFilter(item.value)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${filter === item.value ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error mb-5 text-sm">We could not load your task history. Please refresh and try again.</div>}

        {loading ? (
          <div className="grid gap-4">{[1, 2, 3].map((item) => <div className="card space-y-3" key={item}><Skeleton className="h-5 w-2/3" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-3 w-full" /></div>)}</div>
        ) : visible.length === 0 ? (
          <div className="card text-center py-12">
            <ListChecks className="mx-auto mb-3 text-brand-500" size={34} />
            <h2 className="font-semibold mb-1">{filter === 'all' ? 'No tracked tasks yet' : `No ${FILTERS.find((item) => item.value === filter)?.label.toLowerCase()} tasks`}</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>Start a task and it will appear here automatically.</p>
            <Link to="/tasks" className="btn-secondary inline-flex items-center gap-2 text-sm">Browse available tasks <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {visible.map((submission, index) => {
              const meta = getTaskStatusMeta(submission.status);
              const taskCode = submission.task?.taskCode;
              const reward = submission.rewardPaid ?? submission.rewardApproved ?? submission.task?.reward;
              return (
                <article className="card" key={submission.id} data-aos="fade-up" data-aos-delay={index * 40}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="font-semibold">{submission.task?.title ?? 'Task unavailable'}</h2>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.className}`}>{meta.label}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {taskCode ?? 'Giglify task'} · {submission.task?.category ?? 'General'} · Started {formatDate(submission.startedAt)}
                      </p>
                    </div>
                    {reward != null && <span className="font-semibold text-sm text-brand-600 dark:text-brand-300">${Number(reward).toFixed(2)}</span>}
                  </div>
                  <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>{meta.description}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {submission.status === 'approved' ? `Completed ${formatDate(submission.completedAt)}` : submission.status === 'submitted' ? 'Submitted for review' : `Last started ${formatDate(submission.startedAt)}`}
                    </span>
                    {taskCode && submission.status !== 'submitted' && submission.status !== 'approved' && (
                      <Link to={`/tasks/${encodeURIComponent(taskCode)}`} className="btn-secondary inline-flex items-center gap-2 text-xs">
                        {submission.status === 'rejected' ? <RotateCcw size={14} /> : <ArrowRight size={14} />}
                        {submission.status === 'rejected' ? 'Try again' : 'Continue'}
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
