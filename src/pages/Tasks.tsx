import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Bookmark, BookmarkCheck, Clock3, Laptop, Smartphone, Globe2 } from 'lucide-react';
import { TaskListSkeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { getProfileCompletion, PROFILE_TASK_LIMIT_THRESHOLD, DAILY_TASK_LIMIT_BELOW_THRESHOLD } from '../utils/profileCompletion';
import { fetchTasks } from '../lib/taskQuestionsApi';
import type { TaskCatalogItem } from '../lib/taskCatalog';
import { fetchSavedTaskIds, saveTask, unsaveTask } from '../lib/savedTasks';
import { fetchPackageVisibility } from '../lib/paymentsApi';
import type { PackageVisibility } from '../lib/packageVisibility';

type TaskDevice = 'any' | 'mobile' | 'desktop';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
const QUESTION_TYPES = [
  { value: 'mcq', label: 'MCQ' },
  { value: 'saq', label: 'SAQ' },
] as const;
const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'ai-training', label: 'AI training' },
  { value: 'coding', label: 'Coding' },
  { value: 'data-labeling', label: 'Data labeling' },
  { value: 'design', label: 'Design' },
  { value: 'research', label: 'Research' },
  { value: 'translation', label: 'Translation' },
  { value: 'writing', label: 'Writing' },
] as const;
const DEVICES: { value: TaskDevice; label: string; icon: typeof Globe2 }[] = [
  { value: 'any', label: 'Any device', icon: Globe2 },
  { value: 'mobile', label: 'Mobile', icon: Smartphone },
  { value: 'desktop', label: 'Desktop', icon: Laptop },
];
const PAY_BANDS = [
  { label: 'Under $5', test: (r: number) => r < 5 },
  { label: '$5 – $10', test: (r: number) => r >= 5 && r <= 10 },
  { label: 'Over $10', test: (r: number) => r > 10 },
];

export default function TasksPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskCatalogItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState<Set<string>>(new Set());
  const [questionType, setQuestionType] = useState<Set<string>>(new Set());
  const [device, setDevice] = useState<Set<TaskDevice>>(new Set());
  const [payBand, setPayBand] = useState<Set<string>>(new Set());
  const [savedTaskIds, setSavedTaskIds] = useState<Set<string>>(new Set());
  const [savedOnly, setSavedOnly] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [packageVisibility, setPackageVisibility] = useState<PackageVisibility | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTasks().then(({ tasks: fetchedTasks, error: fetchError }) => {
      if (cancelled) return;
      setTasks(fetchedTasks);
      setError(fetchError?.message ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    void fetchSavedTaskIds(user.id).then((ids) => {
      if (!cancelled) setSavedTaskIds(ids);
    }).catch(() => {
      if (!cancelled) setSavedTaskIds(new Set());
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    void fetchPackageVisibility(user.id).then(setPackageVisibility).catch(() => setPackageVisibility(null));
  }, [user?.id]);

  const completion = getProfileCompletion(user);
  const gated = completion < PROFILE_TASK_LIMIT_THRESHOLD;
  const tierRank: Record<string, number> = { free: 0, pro: 1, elite: 2, max: 3 };
  const canAccessTask = (task: TaskCatalogItem) => {
    if (gated || !packageVisibility) return false;
    if ((tierRank[packageVisibility.tier] ?? -1) < (tierRank[task.minimumTier || 'free'] ?? 0)) return false;
    if (packageVisibility.maxTaskRewardUsd !== null && task.reward > packageVisibility.maxTaskRewardUsd) return false;
    if (packageVisibility.tasksRemaining !== null && packageVisibility.tasksRemaining <= 0) return false;
    if (packageVisibility.dailyTasksAllowed !== null && packageVisibility.tasksUsedToday >= packageVisibility.dailyTasksAllowed) return false;
    if (packageVisibility.weeklyTasksAllowed !== null && packageVisibility.tasksUsedThisWeek >= packageVisibility.weeklyTasksAllowed) return false;
    return true;
  };

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const clearFilters = () => {
    setSearch('');
    setDifficulty(new Set());
    setCategory(new Set());
    setQuestionType(new Set());
    setDevice(new Set());
    setPayBand(new Set());
    setSavedOnly(false);
  };

  const hasFilters = Boolean(search.trim()) || category.size > 0 || questionType.size > 0 || difficulty.size > 0 || device.size > 0 || payBand.size > 0 || savedOnly;

  async function toggleSavedTask(taskId: string) {
    if (!user?.id || savingTaskId) return;
    const wasSaved = savedTaskIds.has(taskId);
    setSavingTaskId(taskId);
    setSavedTaskIds((current) => {
      const next = new Set(current);
      if (wasSaved) next.delete(taskId); else next.add(taskId);
      return next;
    });
    try {
      if (wasSaved) await unsaveTask(user.id, taskId);
      else await saveTask(user.id, taskId);
    } catch {
      setSavedTaskIds((current) => {
        const next = new Set(current);
        if (wasSaved) next.add(taskId); else next.delete(taskId);
        return next;
      });
    } finally {
      setSavingTaskId(null);
    }
  }

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const q = search.trim().toLowerCase();
      if (savedOnly && !savedTaskIds.has(task.id)) return false;
      if (q && !task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
      const normalizedCategory = task.category.toLowerCase().replace(/[_\s]+/g, '-');
      const normalizedQuestionType = (task.taskType || 'saq').toLowerCase();
      if (category.size && !category.has(normalizedCategory)) return false;
      if (questionType.size && !questionType.has(normalizedQuestionType)) return false;
      if (difficulty.size && !difficulty.has(task.difficulty)) return false;
      // "Any device" is an unrestricted option, not a task device value.
      if (device.size && !device.has('any') && !device.has(task.device)) return false;
      if (payBand.size) {
        const matches = PAY_BANDS.filter((b) => payBand.has(b.label)).some((b) => b.test(task.reward));
        if (!matches) return false;
      }
      return true;
    });
  }, [tasks, search, category, questionType, difficulty, device, payBand, savedOnly, savedTaskIds]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main className="container py-8">
        <h1 className="font-display text-2xl mb-1" data-aos="fade-down">Available Tasks</h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          {tasks.length} task{tasks.length === 1 ? '' : 's'} available
        </p>

        {gated && (
          <div className="alert alert-info text-sm flex flex-wrap items-center justify-between gap-2" data-aos="fade-in">
            <span>
              Your profile is {completion}% complete. Below {PROFILE_TASK_LIMIT_THRESHOLD}%, you're limited to{' '}
              {DAILY_TASK_LIMIT_BELOW_THRESHOLD} task{(DAILY_TASK_LIMIT_BELOW_THRESHOLD as number) === 1 ? '' : 's'}/day.
            </span>
            <Link to="/profile" className="btn-secondary text-xs px-3 py-1.5 whitespace-nowrap">Complete profile</Link>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4" data-aos="fade-up">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks by title or description…"
            className="input-field pl-10"
          />
        </div>

        {/* Filter divs */}
        <div className="flex flex-wrap items-end gap-4 mb-6" data-aos="fade-up" data-aos-delay="60">
          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
              !hasFilters
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'
            } disabled:cursor-default disabled:opacity-100`}
          >
            All tasks
          </button>

          <button
            type="button"
            onClick={() => setSavedOnly((current) => !current)}
            className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors flex items-center gap-1.5 ${savedOnly ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`}
          >
            <Bookmark size={13} /> Saved ({savedTaskIds.size})
          </button>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Category</p>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => toggle(category, item.value, setCategory)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${category.has(item.value) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Question type</p>
            <div className="flex gap-1.5 flex-wrap">
              {QUESTION_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => toggle(questionType, item.value, setQuestionType)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${questionType.has(item.value) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Difficulty</p>
            <div className="flex gap-1.5 flex-wrap">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => toggle(difficulty, d, setDifficulty)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold capitalize transition-colors ${
                    difficulty.has(d) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Pay</p>
            <div className="flex gap-1.5 flex-wrap">
              {PAY_BANDS.map((b) => (
                <button
                  key={b.label}
                  onClick={() => toggle(payBand, b.label, setPayBand)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                    payBand.has(b.label) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>Device</p>
            <div className="flex gap-1.5 flex-wrap">
              {DEVICES.map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    if (d.value === 'any') {
                      setDevice(device.has('any') ? new Set() : new Set(['any']));
                      return;
                    }
                    const next = new Set(device);
                    next.delete('any');
                    next.has(d.value) ? next.delete(d.value) : next.add(d.value);
                    setDevice(next);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold flex items-center gap-1 transition-colors ${
                    device.has(d.value) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <d.icon size={12} /> {d.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <TaskListSkeleton count={4} />
        ) : error ? (
          <div className="alert alert-error text-sm">Unable to load tasks: {error}</div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-10" style={{ color: 'var(--text-muted)' }}>
            {tasks.length === 0 ? 'No tasks are available right now.' : 'No tasks match your filters. Try clearing a few.'}
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((task, index) => (
              <div
                key={task.id}
                className="card hover:shadow-md cursor-pointer transition-all transform hover:scale-[1.01]"
                data-aos="fade-up"
                data-aos-delay={Math.min(index * 60, 300)}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold">{task.title}</h3>
                      <span className={`badge ${task.category === 'academic' || task.category === 'research' ? 'badge-blue' : 'badge-purple'}`}>{task.category.replace('-', ' ')}</span>
                      <span className="badge badge-yellow">{task.taskType?.toUpperCase() || 'SAQ'}</span>
                      <span className={`badge ${task.difficulty === 'easy' ? 'badge-green' : task.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'}`}>
                        {task.difficulty}
                      </span>
                      {task.device !== 'any' && (
                        <span className="badge badge-blue flex items-center gap-1">
                          {task.device === 'desktop' ? <Laptop size={11} /> : <Smartphone size={11} />} {task.device}
                        </span>
                      )}
                    </div>
                    <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                    <div className="text-xs inline-flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                      <Clock3 size={12} aria-hidden="true" />
                      {task.estimatedTime} min
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <button type="button" aria-label={savedTaskIds.has(task.id) ? `Remove ${task.title} from saved tasks` : `Save ${task.title}`} title={savedTaskIds.has(task.id) ? 'Remove from saved tasks' : 'Save task'} disabled={!user?.id || savingTaskId === task.id} onClick={() => void toggleSavedTask(task.id)} className="mb-2 ml-auto flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-300 disabled:opacity-50">
                      {savedTaskIds.has(task.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      {savedTaskIds.has(task.id) ? 'Saved' : 'Save'}
                    </button>
                    <p className="font-display text-2xl font-bold text-green-600 dark:text-green-400">+${task.reward}</p>
                    {task.taskCode && canAccessTask(task) ? (
                      <Link to={`/tasks/${encodeURIComponent(task.taskCode)}`} className="mt-2 btn-primary text-sm px-3 py-1 flex items-center gap-1 ml-auto">
                        Start <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <Link to="/deposit#packages" className="mt-2 btn-secondary text-sm px-3 py-1 flex items-center gap-1 ml-auto">Unlock <ArrowRight size={14} /></Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
