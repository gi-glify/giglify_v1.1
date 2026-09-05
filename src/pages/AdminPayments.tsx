import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../context/ThemeContext';

type ReviewItem = { id: string; user_id: string; status: string; created_at: string; amount?: number; method?: string };

async function review(entityType: string, entityId: string, action: string) {
  const { data, error } = await supabase.functions.invoke('admin-payment-action', { body: { entityType, entityId, action } });
  if (error) throw new Error(error.message);
  return data;
}

export default function AdminPaymentsPage() {
  const { theme } = useTheme();
  const [deposits, setDeposits] = useState<ReviewItem[]>([]);
  const [payouts, setPayouts] = useState<ReviewItem[]>([]);
  const [error, setError] = useState('');

  async function load() {
    const [depositResult, payoutResult] = await Promise.all([
      supabase.from('verification_deposits').select('id, user_id, status, created_at, amount_usd, method').in('status', ['pending', 'held']).order('created_at', { ascending: true }),
      supabase.from('payout_requests').select('id, user_id, status, created_at, amount').in('status', ['requested', 'under_review', 'approved']).order('created_at', { ascending: true }),
    ]);
    if (depositResult.error) throw depositResult.error;
    if (payoutResult.error) throw payoutResult.error;
    setDeposits((depositResult.data || []).map((item) => ({ ...item, amount: Number(item.amount_usd) })));
    setPayouts((payoutResult.data || []).map((item) => ({ ...item, amount: Number(item.amount) })));
  }

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Unable to load payment reviews.')); }, []);

  async function act(entityType: string, entityId: string, action: string) {
    setError('');
    try { await review(entityType, entityId, action); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Unable to apply review action.'); }
  }

  return (
    <div className="min-h-screen transition-colors" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main className="container py-8">
        <h1 className="font-display text-2xl font-bold mb-2">Payment Reviews</h1>
        <p className={`mb-8 text-sm ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`}>Approve verification deposits and payout requests. Every action is audited.</p>
        {error && <div className="alert alert-error mb-6">{error}</div>}
        <section className="card mb-8"><h2 className="font-display text-xl mb-4">Verification deposits</h2><div className="space-y-3">
          {deposits.length === 0 && <p className="text-sm opacity-70">No verification deposits awaiting review.</p>}
          {deposits.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4"><div><p className="font-semibold">{item.method} · ${item.amount?.toFixed(2)}</p><p className="text-xs opacity-70">User {item.user_id} · {new Date(item.created_at).toLocaleString()}</p></div><div className="flex gap-2"><button aria-label="Approve verification" className="btn-primary px-3 py-2 rounded-lg" onClick={() => act('verification_deposit', item.id, 'approve')}><Check size={16} /></button><button aria-label="Reject verification" className="btn-secondary px-3 py-2 rounded-lg" onClick={() => act('verification_deposit', item.id, 'reject')}><X size={16} /></button></div></div>)}
        </div></section>
        <section className="card"><h2 className="font-display text-xl mb-4">Payout requests</h2><div className="space-y-3">
          {payouts.length === 0 && <p className="text-sm opacity-70">No payout requests awaiting review.</p>}
          {payouts.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4"><div><p className="font-semibold">${item.amount?.toFixed(2)} · {item.status}</p><p className="text-xs opacity-70">User {item.user_id} · {new Date(item.created_at).toLocaleString()}</p></div><div className="flex gap-2"><button className="btn-primary px-3 py-2 rounded-lg" onClick={() => act('payout_request', item.id, 'approve')}>Approve</button><button className="btn-secondary px-3 py-2 rounded-lg" onClick={() => act('payout_request', item.id, 'reject')}>Reject</button><button className="btn-secondary px-3 py-2 rounded-lg" onClick={() => act('payout_request', item.id, 'mark_paid')}>Mark paid</button></div></div>)}
        </div></section>
      </main>
    </div>
  );
}
