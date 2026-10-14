import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../context/ThemeContext';

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

export default function AdminPaymentsPage() {
  const { theme } = useTheme();
  const [deposits, setDeposits] = useState<ReviewItem[]>([]);
  const [payouts, setPayouts] = useState<ReviewItem[]>([]);
  const [appeals, setAppeals] = useState<ReviewItem[]>([]);
  const [requesterApplications, setRequesterApplications] = useState<RequesterApplication[]>([]);
  const [requesterDrafts, setRequesterDrafts] = useState<RequesterDraft[]>([]);
  const [packagePayments, setPackagePayments] = useState<PackagePayment[]>([]);
  const [packageStatus, setPackageStatus] = useState('');
  const [error, setError] = useState('');

  async function load() {
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
    setDeposits((depositResult.data || []).map((item) => ({ ...item, amount: Number(item.amount_usd) })));
    setPayouts((payoutResult.data || []).map((item) => ({ ...item, amount: Number(item.amount) })));
    setAppeals(appealResult.data || []);
    if (requesterApplicationsResult.error) throw requesterApplicationsResult.error;
    if (requesterDraftsResult.error) throw requesterDraftsResult.error;
    if (packageQueueResult.error) throw packageQueueResult.error;
    setRequesterApplications(requesterApplicationsResult.data || []);
    setRequesterDrafts((requesterDraftsResult.data || []).map((item) => ({ ...item, reward: Number(item.reward) })));
    setPackagePayments((packageQueueResult.data?.items || []) as PackagePayment[]);
  }

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Unable to load payment reviews.')); }, [packageStatus]);

  async function act(entityType: string, entityId: string, action: string) {
    setError('');
    try { await review(entityType, entityId, action); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to apply review action.'); }
  }

  async function requesterAct(entityType: string, entityId: string, action: string) {
    setError('');
    try { await requesterReview(entityType, entityId, action); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to apply requester review action.'); }
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main className="container py-8">
        <h1 className="font-display text-2xl font-bold mb-2">Payment Reviews</h1>
        <p className={`mb-8 text-sm ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>Approve verification deposits and payout requests. Every action is audited.</p>
        {error && <div className="alert alert-error mb-6">{error}</div>}
        <section className="card mb-8" data-aos="fade-up">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl">Package payment reconciliation</h2>
              <p className="text-sm opacity-70 mt-1">Read-only view of paid tiers, provider callbacks, and payments needing attention.</p>
            </div>
            <label className="text-sm font-semibold">Status<select className="input-field mt-2" value={packageStatus} onChange={(event) => setPackageStatus(event.target.value)}><option value="">All</option><option value="pending">Pending</option><option value="processing">Processing</option><option value="success">Success</option><option value="completed">Completed</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option><option value="expired">Expired</option></select></label>
          </div>
          <div className="space-y-3 mt-5">
            {packagePayments.length === 0 && <p className="text-sm opacity-70">No package payments match this filter.</p>}
            {packagePayments.map((item) => {
              const attempt = [...(item.payment_attempts || [])].sort((left, right) => right.attempt_number - left.attempt_number)[0];
              const isOpen = ['created', 'pending', 'processing'].includes(item.status);
              const isStale = isOpen && Date.now() - new Date(item.created_at).getTime() > 15 * 60 * 1000;
              return <article key={item.id} className={`rounded-lg border p-4 ${isStale ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/20' : 'border-sand-200 dark:border-stone-600'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize">{item.package_tier || 'Unknown tier'} · {item.provider || 'Unknown provider'} · {Number(item.amount).toFixed(2)} {item.currency}</p>
                    <p className="text-xs opacity-70 mt-1">User {item.user_id} · {item.tuid || item.id} · {new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-semibold capitalize">{item.status}</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-3 mt-3 text-sm">
                  <span>Verification: <strong>{item.verification_status}</strong></span>
                  <span>Request: <strong>{attempt?.request_status || '—'}</strong></span>
                  <span>Callback: <strong>{attempt?.callback_status || '—'}</strong></span>
                </div>
                {isStale && <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mt-3">Needs reconciliation: payment has remained open for more than 15 minutes.</p>}
                {(item.technical_error || attempt?.technical_error) && <p className="text-sm text-red-700 dark:text-red-300 mt-3">Error: {item.technical_error || attempt?.technical_error}</p>}
              </article>;
            })}
          </div>
        </section>
        <section className="card mb-8" data-aos="fade-up"><h2 className="font-display text-xl mb-4">Requester KYC applications</h2><div className="space-y-3">{requesterApplications.length === 0 && <p className="text-sm opacity-70">No requester applications ready for review.</p>}{requesterApplications.map((item) => <div key={item.id} className="rounded-lg border border-sand-200 dark:border-stone-600 p-4"><p className="font-semibold">{item.legal_name} · User {item.user_id}</p><p className="text-xs opacity-70 mt-1">Review ready {new Date(item.review_available_at).toLocaleString()}</p><p className="text-sm mt-3">{item.task_brief}</p><div className="flex gap-2 mt-3"><button className="btn-primary px-3 py-2" onClick={() => requesterAct('requester_application', item.id, 'approve')}>Approve requester</button><button className="btn-secondary px-3 py-2" onClick={() => requesterAct('requester_application', item.id, 'reject')}>Reject</button></div></div>)}</div></section>
        <section className="card mb-8" data-aos="fade-up"><h2 className="font-display text-xl mb-4">Requester task drafts</h2><div className="space-y-3">{requesterDrafts.length === 0 && <p className="text-sm opacity-70">No requester task drafts awaiting review.</p>}{requesterDrafts.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4"><div><p className="font-semibold">{item.title}</p><p className="text-xs opacity-70">User {item.requester_id} · {item.category} · {item.difficulty} · ${item.reward.toFixed(2)}</p></div><div className="flex gap-2"><button className="btn-primary px-3 py-2" onClick={() => requesterAct('requester_task', item.id, 'approve')}>Approve</button><button className="btn-secondary px-3 py-2" onClick={() => requesterAct('requester_task', item.id, 'reject')}>Reject</button></div></div>)}</div></section>
        <section className="card mb-8"><h2 className="font-display text-xl mb-4">Verification deposits</h2><div className="space-y-3">
          {deposits.length === 0 && <p className="text-sm opacity-70">No verification deposits awaiting review.</p>}
          {deposits.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4"><div><p className="font-semibold">{item.method} · ${item.amount?.toFixed(2)}</p><p className="text-xs opacity-70">User {item.user_id} · {new Date(item.created_at).toLocaleString()}</p></div><div className="flex gap-2"><button aria-label="Approve verification" className="btn-primary px-3 py-2 rounded-lg" onClick={() => act('verification_deposit', item.id, 'approve')}><Check size={16} /></button><button aria-label="Reject verification" className="btn-secondary px-3 py-2 rounded-lg" onClick={() => act('verification_deposit', item.id, 'reject')}><X size={16} /></button></div></div>)}
        </div></section>
        <section className="card mt-8"><h2 className="font-display text-xl mb-4">Profile edit appeals</h2><div className="space-y-3">
          {appeals.length === 0 && <p className="text-sm opacity-70">No profile appeals awaiting review.</p>}
          {appeals.map((item) => <div key={item.id} className="rounded-lg border border-sand-200 dark:border-stone-600 p-4"><p className="text-xs opacity-70">User {item.user_id} · {new Date(item.created_at).toLocaleString()}</p><p className="text-sm mt-2">{item.reason}</p><div className="flex gap-2 mt-3"><button className="btn-primary px-3 py-2 rounded-lg" onClick={() => act('profile_edit_appeal', item.id, 'approve')}>Approve</button><button className="btn-secondary px-3 py-2 rounded-lg" onClick={() => act('profile_edit_appeal', item.id, 'reject')}>Reject</button></div></div>)}
        </div></section>
        <section className="card"><h2 className="font-display text-xl mb-4">Payout requests</h2><div className="space-y-3">
          {payouts.length === 0 && <p className="text-sm opacity-70">No payout requests awaiting review.</p>}
          {payouts.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4"><div><p className="font-semibold">${item.amount?.toFixed(2)} · {item.status}</p><p className="text-xs opacity-70">User {item.user_id} · {new Date(item.created_at).toLocaleString()}</p></div><div className="flex gap-2"><button className="btn-primary px-3 py-2 rounded-lg" onClick={() => act('payout_request', item.id, 'approve')}>Approve</button><button className="btn-secondary px-3 py-2 rounded-lg" onClick={() => act('payout_request', item.id, 'reject')}>Reject</button><button className="btn-secondary px-3 py-2 rounded-lg" onClick={() => act('payout_request', item.id, 'mark_paid')}>Mark paid</button></div></div>)}
        </div></section>
      </main>
    </div>
  );
}
