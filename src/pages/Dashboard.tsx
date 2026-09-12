import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowRight, Clock3 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { StatCardSkeleton, TaskListSkeleton } from '../components/ui/Skeleton';
import { fetchTasks } from '../lib/taskQuestionsApi';
import { fetchPackageVisibility } from '../lib/paymentsApi';
import type { PackageVisibility } from '../lib/packageVisibility';
import type { TaskCatalogItem } from '../lib/taskCatalog';
import { getProfileCompletion, PROFILE_TASK_LIMIT_THRESHOLD } from '../utils/profileCompletion';

export default function DashboardPage() {
  useTheme();
  const { user } = useAuthStore();
  const gated = getProfileCompletion(user) < PROFILE_TASK_LIMIT_THRESHOLD;
  const [tasks, setTasks] = useState<TaskCatalogItem[]>([]);
  const [completedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packageVisibility, setPackageVisibility] = useState<PackageVisibility | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTasks().then(({ tasks: fetchedTasks, error: fetchError }) => {
      if (cancelled) return;
      setTasks(fetchedTasks.slice(0, 3));
      setError(fetchError?.message ?? null);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetchPackageVisibility(user.id).then(setPackageVisibility).catch(() => setPackageVisibility(null));
  }, [user?.id]);

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main className="container py-8">
        {/* Welcome Section */}
        <div className="card mb-8 animate-in" data-aos="fade-up">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="font-display text-2xl mb-2">Welcome, {user?.firstName}! 👋</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                You're on track. Keep completing tasks to earn more rewards.
              </p>
            </div>
          </div>
        </div>

        <div className="card mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-brand-500/40 bg-brand-50/60 dark:bg-brand-950/20" data-aos="fade-up" data-aos-delay="40">
          <div>
            <h2 className="font-display text-xl mb-1">Have work that needs doing?</h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Turn your questions, research, and business workflows into paid tasks completed by Giglify’s vetted worker community.</p>
          </div>
          <Link to="/requester/apply" className="btn-primary inline-flex items-center gap-2 shrink-0">
            Create a task <ArrowRight size={16} />
          </Link>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <div className="card animate-in" data-aos="fade-up">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Total Earnings
                </h3>
                <p className="font-display text-3xl font-bold">${user?.balance || 0}.00</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>USD</p>
              </div>

              <div className="card animate-in" data-aos="fade-up" data-aos-delay="80">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Completed Today
                </h3>
                <p className="font-display text-3xl font-bold">{completedToday}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>tasks</p>
              </div>

              <div className="card animate-in" data-aos="fade-up" data-aos-delay="160">
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                  Tier Status
                </h3>
                <p className="font-display text-3xl font-bold capitalize">{user?.subscription}</p>
                <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>Membership</p>
                {user?.subscription === 'free' && (
                  <Link to="/deposit#packages" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300">
                    Update tier <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        {packageVisibility && <section className="card mb-8" aria-label="Package usage">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Package usage</p><h2 className="font-display text-2xl mt-1 capitalize">{packageVisibility.tier}</h2></div>
            <Link to="/deposit?view=packages" className="text-sm font-semibold text-brand-600 dark:text-brand-300">Manage package <ArrowRight size={14} className="inline" /></Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
            <div><span style={{ color: 'var(--text-muted)' }}>Tasks used</span><p className="font-semibold mt-1">{packageVisibility.tasksUsed}{packageVisibility.tasksAllowed === null ? '' : ` / ${packageVisibility.tasksAllowed}`}</p></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Remaining</span><p className="font-semibold mt-1">{packageVisibility.tasksRemaining === null ? 'Unlimited' : packageVisibility.tasksRemaining}</p></div>
            <div><span style={{ color: 'var(--text-muted)' }}>High-paying tasks</span><p className="font-semibold mt-1">{packageVisibility.highPayingEligible ? 'Included' : 'Not included'}</p></div>
          </div>
          {packageVisibility.renewalAt && <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>Renews {new Date(packageVisibility.renewalAt).toLocaleDateString()}</p>}
        </section>}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl">Available Tasks</h2>
            <Link to="/tasks" className="text-sm font-semibold text-brand-600 dark:text-brand-300 flex items-center gap-1">
              See all <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <TaskListSkeleton count={3} />
          ) : error ? (
            <div className="alert alert-error text-sm">Unable to load tasks: {error}</div>
          ) : tasks.length === 0 ? (
            <div className="card text-sm" style={{ color: 'var(--text-muted)' }}>No tasks are available right now.</div>
          ) : (
            <div className="grid gap-4">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="card hover:shadow-md transition-all transform hover:scale-[1.01] animate-in"
                  data-aos="fade-up"
                  data-aos-delay={index * 80}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold">{task.title}</h3>
                        <span className={`badge ${task.category === 'academic' ? 'badge-blue' : 'badge-purple'}`}>
                          {task.category}
                        </span>
                        <span className={`badge ${
                          task.difficulty === 'easy' ? 'badge-green' : task.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'
                        }`}>
                          {task.difficulty}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
                        {task.description}
                      </p>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 size={12} aria-hidden="true" />
                          {task.estimatedTime} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
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
        </div>
      </main>
    </div>
  );
}
