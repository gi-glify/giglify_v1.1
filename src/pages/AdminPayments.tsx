import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ClipboardCheck, ShieldCheck, Wallet, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';

type ReviewItem = { id: string; user_id: string; status: string; created_at: string; amount?: number; method?: string; reason?: string };
type RequesterApplication = { id: string; user_id: string; status: string; submitted_at: string; legal_name: string; task_brief: string; review_available_at: string };
type RequesterDraft = { id: string; requester_id: string; status: string; created_at: string; title: string; category: string; difficulty: string; reward: number };
type PackagePayment = {
  id: string;
  user_id: string;
  tuid: string | null;
  package_tier: string | null;
  provider: string | null;
  amount: number | string;
  currency: string;
  status: string;
  verification_status: string;
  technical_error: string | null;
  created_at: string;
  completed_at: string | null;
  failed_at: string | null;
  payment_attempts?: Array<{
    attempt_number: number;
    provider_request_id: string | null;
    provider_event_id: string | null;
    request_status: string;
    callback_status: string;
    technical_error: string | null;
    updated_at: string;
  }>;
};

const STATUS_TONES: Record<string, string> = {
  approved: 'badge-green',
  success: 'badge-green',
  completed: 'badge-green',
  verified: 'badge-green',
  pending: 'badge-yellow',
  held: 'badge-yellow',
  processing: 'badge-yellow',
  under_review: 'badge-yellow',
  requested: 'badge-yellow',
  failed: 'badge-red',
  rejected: 'badge-red',
  cancelled: 'badge-red',
  expired: 'badge-red',
};

function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${STATUS_TONES[status] || 'badge-blue'} capitalize`}>{status.replaceAll('_', ' ')}</span>;
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatAmount(value: number | string | undefined, currency = 'USD') {
  return `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

async function review(entityType: string, entityId: string, action: string) {
  const { data, error } = await supabase.functions.invoke('admin-payment-action', { body: { entityType, entityId, action } });
  if (error) throw new Error(error.message);
  return data;
}

async function requesterReview(entityType: string, entityId: string, action: string) {
  const { data, error } = await supabase.functions.invoke('admin-requester-action', { body: { entityType, entityId, action } });
  if (error) throw new Error(error.message);
  return data;
}

async function publishRequesterTask(draftId: string) {
  const { data, error } = await supabase.functions.invoke('publish-requester-task', { body: { draftId } });
  if (error) throw new Error(error.message);
  return data;
}

export default function AdminPaymentsPage() {
  const user = useAuthStore((state) => state.user);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deposits, setDeposits] = useState<ReviewItem[]>([]);
  const [payouts, setPayouts] = useState<ReviewItem[]>([]);
  const [appeals, setAppeals] = useState<ReviewItem[]>([]);
  const [requesterApplications, setRequesterApplications] = useState<RequesterApplication[]>([]);
  const [requesterDrafts, setRequesterDrafts] = useState<RequesterDraft[]>([]);
  const [packagePayments, setPackagePayments] = useState<PackagePayment[]>([]);
  const [packageStatus, setPackageStatus] = useState('');
  const [error, setError] = useState('');
  const [busyAction, setBusyAction] = useState('');

  async function load() {
    if (!user?.id || !isAdmin) return;
    setRefreshing(true);
    setError('');
    try {
      const [depositResult, payoutResult, appealResult, requesterApplicationsResult, requesterDraftsResult, packageQueueResult] = await Promise.all([
        supabase.from('verification_deposits').select('id, user_id, status, created_at, amount_usd, method').in('status', ['pending', 'held']).order('created_at', { ascending: true }),
        supabase.from('payout_requests').select('id, user_id, status, created_at, amount').in('status', ['requested', 'under_review', 'approved']).order('created_at', { ascending: true }),
        supabase.from('profile_edit_appeals').select('id, user_id, status, created_at, reason').eq('status', 'pending').order('created_at', { ascending: true }),
        supabase.from('requester_applications').select('id, user_id, status, submitted_at, legal_name, task_brief, review_available_at').in('status', ['review-ready']).order('submitted_at', { ascending: true }),
        supabase.from('requester_task_drafts').select('id, requester_id, status, created_at, title, category, difficulty, reward').eq('status', 'pending_review').order('created_at', { ascending: true }),
        supabase.functions.invoke('admin-payment-queue', { body: { queue: 'packages', limit: 50, status: packageStatus || undefined } }),
      ]);
      if (depositResult.error) throw depositResult.error;
      if (payoutResult.error) throw payoutResult.error;
      if (appealResult.error) throw appealResult.error;
      if (requesterApplicationsResult.error) throw requesterApplicationsResult.error;
      if (requesterDraftsResult.error) throw requesterDraftsResult.error;
      if (packageQueueResult.error) throw packageQueueResult.error;
      setDeposits((depositResult.data || []).map((item) => ({ ...item, amount: Number(item.amount_usd) })));
      setPayouts((payoutResult.data || []).map((item) => ({ ...item, amount: Number(item.amount) })));
      setAppeals(appealResult.data || []);
      setRequesterApplications(requesterApplicationsResult.data || []);
      setRequesterDrafts((requesterDraftsResult.data || []).map((item) => ({ ...item, reward: Number(item.reward) })));
      setPackagePayments((packageQueueResult.data?.items || []) as PackagePayment[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load the admin workspace.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) {
      setIsAdmin(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle().then(({ data, error: profileError }) => {
      if (profileError) throw profileError;
      setIsAdmin(Boolean(data?.is_admin));
    }).catch((profileError) => {
      setIsAdmin(false);
      setError(profileError instanceof Error ? profileError.message : 'Unable to verify admin access.');
      setLoading(false);
    });
  }, [user?.id]);

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin, packageStatus]);

  async function act(entityType: string, entityId: string, action: string) {
    const key = `${entityType}:${entityId}:${action}`;
    setBusyAction(key);
    try {
      await review(entityType, entityId, action);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to apply review action.');
    } finally {
      setBusyAction('');
    }
  }

  async function requesterAct(entityType: string, entityId: string, action: string) {
    const key = `${entityType}:${entityId}:${action}`;
    setBusyAction(key);
    try {
      if (entityType === 'requester_task' && action === 'approve') await publishRequesterTask(entityId);
      else await requesterReview(entityType, entityId, action);
      await load();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to apply requester review action.');
    } finally {
      setBusyAction('');
    }
  }

  const stalePackages = useMemo(() => packagePayments.filter((item) => ['created', 'pending', 'processing'].includes(item.status) && Date.now() - new Date(item.created_at).getTime() > 15 * 60 * 1000).length, [packagePayments]);
  const payoutTotal = useMemo(() => payouts.reduce((total, item) => total + Number(item.amount || 0), 0), [payouts]);
  const totalAttention = deposits.length + payouts.length + appeals.length + requesterApplications.length + requesterDrafts.length + stalePackages;

  if (!user) return <main className="container max-w-2xl py-10"><section className="card text-center"><h1 className="font-display text-2xl">Sign in required</h1><p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>Sign in with an administrator account to open the operations dashboard.</p><Link to="/auth" className="btn-primary inline-flex mt-5">Sign in</Link></section></main>;
  if (loading) return <main className="container py-10"><div className="card text-sm" role="status" aria-live="polite" style={{ color: 'var(--text-muted)' }}>Loading the admin workspace…</div></main>;
  if (!isAdmin) return <main className="container max-w-2xl py-10"><section className="card text-center"><ShieldCheck className="mx-auto mb-3 text-red-600" size={30} /><h1 className="font-display text-2xl">Admin access required</h1><p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>This workspace is restricted to approved Giglify administrators.</p><Link to="/dashboard" className="btn-secondary inline-flex mt-5">Return to dashboard</Link></section></main>;

  return (
    <main className="container py-8 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" data-aos="fade-down">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Admin workspace</p>
          <h1 className="font-display text-3xl mt-1">Operations dashboard</h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Review payments, requester access, payout readiness, and account appeals from one place.</p>
        </div>
        <button type="button" className="btn-secondary inline-flex items-center justify-center gap-2" onClick={() => void load()} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh data'}</button>
      </header>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Admin sections">
        {[['#overview', 'Overview'], ['#packages', 'Package payments'], ['#requesters', 'Requesters'], ['#payouts', 'Payouts'], ['#appeals', 'Appeals']].map(([href, label]) => <a key={href} href={href} className="shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-300">{label}</a>)}
      </nav>

      <section id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Admin overview" data-aos="fade-up">
        <article className="card"><div className="flex items-center justify-between"><p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Needs attention</p><span className="rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"><ClipboardCheck size={18} /></span></div><p className="font-display text-3xl font-bold mt-3">{totalAttention}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Open review items</p></article>
        <article className="card"><div className="flex items-center justify-between"><p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Payout queue</p><span className="rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"><Wallet size={18} /></span></div><p className="font-display text-3xl font-bold mt-3">{formatAmount(payoutTotal)}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{payouts.length} request{payouts.length === 1 ? '' : 's'} awaiting review</p></article>
        <article className="card"><div className="flex items-center justify-between"><p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Requester queue</p><span className="rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"><ShieldCheck size={18} /></span></div><p className="font-display text-3xl font-bold mt-3">{requesterApplications.length + requesterDrafts.length}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{requesterApplications.length} applications · {requesterDrafts.length} drafts</p></article>
        <article className={`card ${stalePackages ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}><div className="flex items-center justify-between"><p className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>Stale payments</p><span className="rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">!</span></div><p className="font-display text-3xl font-bold mt-3">{stalePackages}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Open longer than 15 minutes</p></article>
      </section>

      <section id="packages" className="card scroll-mt-24" data-aos="fade-up">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Payments</p><h2 className="font-display text-2xl mt-1">Package reconciliation</h2><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Read-only provider, callback, entitlement, and failure visibility for paid tiers.</p></div><label className="text-sm font-semibold sm:min-w-44">Status<select aria-label="Package payment status" className="input-field mt-2 py-2" value={packageStatus} onChange={(event) => setPackageStatus(event.target.value)}><option value="">All statuses</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="success">Success</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select></label></div>
        <div className="mt-5 space-y-3">{packagePayments.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No package payments match this filter.</p>}{packagePayments.map((item) => { const attempt = [...(item.payment_attempts || [])].sort((left, right) => right.attempt_number - left.attempt_number)[0]; const isOpen = ['created', 'pending', 'processing'].includes(item.status); const isStale = isOpen && Date.now() - new Date(item.created_at).getTime() > 15 * 60 * 1000; return <article key={item.id} className={`rounded-xl border p-4 ${isStale ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : 'border-[var(--border)]'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold capitalize">{item.package_tier || 'Unknown tier'} · {item.provider || 'Unknown provider'}</h3><StatusBadge status={item.status} /></div><p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{formatAmount(item.amount, item.currency)} · {item.tuid || item.id} · {formatDate(item.created_at)}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>User {item.user_id}</p></div></div><div className="grid gap-2 sm:grid-cols-3 mt-4 text-sm"><span>Entitlement: <strong>{item.verification_status || '—'}</strong></span><span>Request: <strong>{attempt?.request_status || '—'}</strong></span><span>Callback: <strong>{attempt?.callback_status || '—'}</strong></span></div>{isStale && <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mt-3">Needs reconciliation: this payment has remained open for more than 15 minutes.</p>}{(item.technical_error || attempt?.technical_error) && <p className="alert alert-error mt-3 text-sm">{item.technical_error || attempt?.technical_error}</p>}</article>; })}</div>
      </section>

      <section id="requesters" className="grid gap-6 xl:grid-cols-2 scroll-mt-24">
        <article className="card" data-aos="fade-up"><div className="flex items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Identity</p><h2 className="font-display text-2xl mt-1">Requester applications</h2></div><StatusBadge status="review-ready" /></div><div className="space-y-3">{requesterApplications.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No requester applications ready for review.</p>}{requesterApplications.map((item) => { const key = `requester_application:${item.id}:`; return <div key={item.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.legal_name}</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>User {item.user_id} · Ready {formatDate(item.review_available_at)}</p></div><StatusBadge status={item.status} /></div><p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>{item.task_brief}</p><div className="flex flex-wrap gap-2 mt-4"><button type="button" className="btn-primary px-3 py-2 text-sm" disabled={busyAction === `${key}approve`} onClick={() => void requesterAct('requester_application', item.id, 'approve')}>{busyAction === `${key}approve` ? 'Approving…' : 'Approve requester'}</button><button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={busyAction === `${key}reject`} onClick={() => void requesterAct('requester_application', item.id, 'reject')}>{busyAction === `${key}reject` ? 'Rejecting…' : 'Reject'}</button></div></div>; })}</div></article>
        <article className="card" data-aos="fade-up" data-aos-delay="60"><div className="flex items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Marketplace</p><h2 className="font-display text-2xl mt-1">Task drafts</h2></div><StatusBadge status="pending_review" /></div><div className="space-y-3">{requesterDrafts.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No requester task drafts awaiting review.</p>}{requesterDrafts.map((item) => { const approveKey = `requester_task:${item.id}:approve`; const rejectKey = `requester_task:${item.id}:reject`; return <div key={item.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.title}</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>User {item.requester_id} · {item.category} · {item.difficulty} · {formatAmount(item.reward)}</p></div><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(item.created_at)}</span></div><div className="flex flex-wrap gap-2 mt-4"><button type="button" className="btn-primary px-3 py-2 text-sm" disabled={busyAction === approveKey} onClick={() => void requesterAct('requester_task', item.id, 'approve')}>{busyAction === approveKey ? 'Publishing…' : 'Approve and publish'}</button><button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={busyAction === rejectKey} onClick={() => void requesterAct('requester_task', item.id, 'reject')}>{busyAction === rejectKey ? 'Rejecting…' : 'Reject'}</button></div></div>; })}</div></article>
      </section>

      <section id="payouts" className="grid gap-6 xl:grid-cols-2 scroll-mt-24">
        <article className="card" data-aos="fade-up"><div className="flex items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Verification</p><h2 className="font-display text-2xl mt-1">Verification deposits</h2></div><StatusBadge status="held" /></div><div className="space-y-3">{deposits.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No verification deposits awaiting review.</p>}{deposits.map((item) => { const approveKey = `verification_deposit:${item.id}:approve`; const rejectKey = `verification_deposit:${item.id}:reject`; return <div key={item.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.method || 'Provider'} · {formatAmount(item.amount)}</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>User {item.user_id} · {formatDate(item.created_at)}</p></div><StatusBadge status={item.status} /></div><div className="flex gap-2 mt-4"><button type="button" aria-label="Approve verification" className="btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm" disabled={busyAction === approveKey} onClick={() => void act('verification_deposit', item.id, 'approve')}><Check size={16} /> Approve</button><button type="button" aria-label="Reject verification" className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm" disabled={busyAction === rejectKey} onClick={() => void act('verification_deposit', item.id, 'reject')}><X size={16} /> Reject</button></div></div>; })}</div></article>
        <article className="card" data-aos="fade-up" data-aos-delay="60"><div className="flex items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Payouts</p><h2 className="font-display text-2xl mt-1">Payout requests</h2></div><StatusBadge status="requested" /></div><div className="space-y-3">{payouts.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No payout requests awaiting review.</p>}{payouts.map((item) => { const approveKey = `payout_request:${item.id}:approve`; const rejectKey = `payout_request:${item.id}:reject`; const paidKey = `payout_request:${item.id}:mark_paid`; return <div key={item.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{formatAmount(item.amount)}</h3><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>User {item.user_id} · {formatDate(item.created_at)}</p></div><StatusBadge status={item.status} /></div><div className="flex flex-wrap gap-2 mt-4"><button type="button" className="btn-primary px-3 py-2 text-sm" disabled={busyAction === approveKey} onClick={() => void act('payout_request', item.id, 'approve')}>{busyAction === approveKey ? 'Approving…' : 'Approve'}</button><button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={busyAction === rejectKey} onClick={() => void act('payout_request', item.id, 'reject')}>{busyAction === rejectKey ? 'Rejecting…' : 'Reject'}</button><button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={busyAction === paidKey} onClick={() => void act('payout_request', item.id, 'mark_paid')}>{busyAction === paidKey ? 'Saving…' : 'Mark paid'}</button></div></div>; })}</div></article>
      </section>

      <section id="appeals" className="card scroll-mt-24" data-aos="fade-up"><div className="flex items-start justify-between gap-3 mb-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Accounts</p><h2 className="font-display text-2xl mt-1">Profile edit appeals</h2></div><StatusBadge status="pending" /></div><div className="space-y-3">{appeals.length === 0 && <p className="rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center" style={{ color: 'var(--text-muted)' }}>No profile appeals awaiting review.</p>}{appeals.map((item) => { const approveKey = `profile_edit_appeal:${item.id}:approve`; const rejectKey = `profile_edit_appeal:${item.id}:reject`; return <div key={item.id} className="rounded-xl border border-[var(--border)] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold">User {item.user_id}</p><p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{formatDate(item.created_at)}</p></div><StatusBadge status={item.status} /></div><p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>{item.reason || 'No reason supplied.'}</p><div className="flex gap-2 mt-4"><button type="button" className="btn-primary px-3 py-2 text-sm" disabled={busyAction === approveKey} onClick={() => void act('profile_edit_appeal', item.id, 'approve')}>{busyAction === approveKey ? 'Approving…' : 'Approve'}</button><button type="button" className="btn-secondary px-3 py-2 text-sm" disabled={busyAction === rejectKey} onClick={() => void act('profile_edit_appeal', item.id, 'reject')}>{busyAction === rejectKey ? 'Rejecting…' : 'Reject'}</button></div></div>; })}</div></section>
    </main>
  );
}
