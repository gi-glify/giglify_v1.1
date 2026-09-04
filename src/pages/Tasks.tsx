import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Clock3, Laptop, Smartphone, Globe2 } from 'lucide-react';
import { TaskListSkeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { getProfileCompletion, PROFILE_TASK_LIMIT_THRESHOLD, DAILY_TASK_LIMIT_BELOW_THRESHOLD } from '../utils/profileCompletion';
import { fetchTasks } from '../lib/taskQuestionsApi';
import type { TaskCatalogItem } from '../lib/taskCatalog';

type TaskDevice = 'any' | 'mobile' | 'desktop';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'expert'] as const;
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
  const [device, setDevice] = useState<Set<TaskDevice>>(new Set());
  const [payBand, setPayBand] = useState<Set<string>>(new Set());

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

  const completion = getProfileCompletion(user);
  const gated = completion < PROFILE_TASK_LIMIT_THRESHOLD;

  const toggle = <T,>(set: Set<T>, value: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    setter(next);
  };

  const filtered = useMemo(() => {
    return tasks.filter((task) => {
      const q = search.trim().toLowerCase();
      if (q && !task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q)) return false;
      if (difficulty.size && !difficulty.has(task.difficulty)) return false;
      if (device.size && !device.has(task.device)) return false;
      if (payBand.size) {
        const matches = PAY_BANDS.filter((b) => payBand.has(b.label)).some((b) => b.test(task.reward));
        if (!matches) return false;
      }
      return true;
    });
  }, [search, difficulty, device, payBand]);

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
        <div className="flex flex-wrap gap-4 mb-6" data-aos="fade-up" data-aos-delay="60">
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
                  onClick={() => toggle(device, d.value, setDevice)}
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
                      <span className={`badge ${task.category === 'academic' ? 'badge-blue' : 'badge-purple'}`}>{task.category}</span>
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
                    <p className="font-display text-2xl font-bold text-green-600 dark:text-green-400">+${task.reward}</p>
                    {task.taskCode && !gated ? (
                      <Link to={`/tasks/${encodeURIComponent(task.taskCode)}`} className="mt-2 btn-primary text-sm px-3 py-1 flex items-center gap-1 ml-auto">
                        Start <ArrowRight size={14} />
                      </Link>
                    ) : (
                      <button disabled className="mt-2 btn-primary text-sm px-3 py-1 flex items-center gap-1 ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
                        Start <ArrowRight size={14} />
                      </button>
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
