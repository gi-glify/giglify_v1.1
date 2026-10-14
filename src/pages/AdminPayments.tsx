import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { createTestPackagePayment, fetchPackagePaymentStatus, startPackagePayment } from '../lib/paymentsApi';
import { useTheme } from '../context/ThemeContext';

type ReviewItem = { id: string; user_id: string; status: string; created_at: string; amount?: number; method?: string; reason?: string };
type RequesterApplication = { id: string; user_id: string; status: string; submitted_at: string; legal_name: string; task_brief: string; review_available_at: string };
type RequesterDraft = { id: string; requester_id: string; status: string; created_at: string; title: string; category: string; difficulty: string; reward: number };

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
  const [error, setError] = useState('');
  const [testTier, setTestTier] = useState<'pro' | 'elite'>('pro');
  const [testAmountKes, setTestAmountKes] = useState('10');
  const [testPhone, setTestPhone] = useState('');
  const [testSubmitting, setTestSubmitting] = useState(false);
  const [testTransactionId, setTestTransactionId] = useState('');
  const [testStatus, setTestStatus] = useState('');

  async function load() {
    const [depositResult, payoutResult, appealResult, requesterApplicationsResult, requesterDraftsResult] = await Promise.all([
      supabase.from('verification_deposits').select('id, user_id, status, created_at, amount_usd, method').in('status', ['pending', 'held']).order('created_at', { ascending: true }),
      supabase.from('payout_requests').select('id, user_id, status, created_at, amount').in('status', ['requested', 'under_review', 'approved']).order('created_at', { ascending: true }),
      supabase.from('profile_edit_appeals').select('id, user_id, status, created_at, reason').eq('status', 'pending').order('created_at', { ascending: true }),
      supabase.from('requester_applications').select('id, user_id, status, submitted_at, legal_name, task_brief, review_available_at').in('status', ['review-ready']).order('submitted_at', { ascending: true }),
      supabase.from('requester_task_drafts').select('id, requester_id, status, created_at, title, category, difficulty, reward').eq('status', 'pending_review').order('created_at', { ascending: true }),
    ]);
    if (depositResult.error) throw depositResult.error;
    if (payoutResult.error) throw payoutResult.error;
    if (appealResult.error) throw appealResult.error;
    setDeposits((depositResult.data || []).map((item) => ({ ...item, amount: Number(item.amount_usd) })));
    setPayouts((payoutResult.data || []).map((item) => ({ ...item, amount: Number(item.amount) })));
    setAppeals(appealResult.data || []);
    if (requesterApplicationsResult.error) throw requesterApplicationsResult.error;
    if (requesterDraftsResult.error) throw requesterDraftsResult.error;
    setRequesterApplications(requesterApplicationsResult.data || []);
    setRequesterDrafts((requesterDraftsResult.data || []).map((item) => ({ ...item, reward: Number(item.reward) })));
  }

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Unable to load payment reviews.')); }, []);

  async function act(entityType: string, entityId: string, action: string) {
    setError('');
    try { await review(entityType, entityId, action); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to apply review action.'); }
  }

  async function requesterAct(entityType: string, entityId: string, action: string) {
    setError('');
    try { await requesterReview(entityType, entityId, action); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to apply requester review action.'); }
  }

  useEffect(() => {
    if (!testTransactionId || ['success', 'failed', 'cancelled', 'expired'].includes(testStatus)) return;
    const timer = window.setInterval(() => {
      void fetchPackagePaymentStatus(testTransactionId)
        .then((result) => setTestStatus(result.status))
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [testTransactionId, testStatus]);

  async function startTestPayment() {
    setError('');
    setTestStatus('starting');
    setTestSubmitting(true);
    try {
      const amountKes = Number(testAmountKes);
      if (!Number.isSafeInteger(amountKes) || amountKes < 1 || amountKes > 250000) {
        throw new Error('Enter a whole KES amount between 1 and 250000.');
      }
      if (!testPhone.trim()) throw new Error('Enter the Safaricom number to receive the STK prompt.');
      const created = await createTestPackagePayment({ tier: testTier, amountKes });
      setTestTransactionId(created.transactionId);
      const started = await startPackagePayment({ transactionId: created.transactionId, phone: testPhone.trim() });
      setTestStatus(started.status || 'pending');
    } catch (testError) {
      setTestStatus('failed');
      setError(testError instanceof Error ? testError.message : 'Unable to start the test payment.');
    } finally {
      setTestSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main className="container py-8">
        <h1 className="font-display text-2xl font-bold mb-2">Payment Reviews</h1>
        <p className={`mb-8 text-sm ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>Approve verification deposits and payout requests. Every action is audited.</p>
        {error && <div className="alert alert-error mb-6">{error}</div>}
        <section className="card mb-8 border-2 border-amber-400/60" data-aos="fade-up">
          <h2 className="font-display text-xl mb-2">Daraja test payment</h2>
          <p className="text-sm opacity-75 mb-5">Admin-only test flow. This does not change public package prices; it charges the custom KES amount to the phone below and runs through the real STK callback.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold">Package<select className="input-field w-full mt-2" value={testTier} onChange={(event) => setTestTier(event.target.value as 'pro' | 'elite')}><option value="pro">Pro</option><option value="elite">Elite</option></select></label>
            <label className="text-sm font-semibold">Test amount (KES)<input className="input-field w-full mt-2" inputMode="numeric" min="1" max="250000" step="1" value={testAmountKes} onChange={(event) => setTestAmountKes(event.target.value)} /></label>
            <label className="text-sm font-semibold">Safaricom phone<input className="input-field w-full mt-2" type="tel" placeholder="0712345678" value={testPhone} onChange={(event) => setTestPhone(event.target.value)} /></label>
          </div>
          <button type="button" className="btn-primary mt-5 px-4 py-2 rounded-lg disabled:opacity-60" disabled={testSubmitting} onClick={() => void startTestPayment()}>{testSubmitting ? 'Starting test STK…' : 'Send test STK prompt'}</button>
          {testStatus && <p className="text-sm mt-4">Test payment status: <span className="font-semibold">{testStatus}</span>{testTransactionId && <span className="opacity-70"> · {testTransactionId}</span>}</p>}
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
