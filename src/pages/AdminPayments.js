import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ClipboardCheck, ShieldCheck, Wallet, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useAuthStore } from '../store/authStore';
const STATUS_TONES = {
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
function StatusBadge({ status }) {
    return _jsx("span", { className: `badge ${STATUS_TONES[status] || 'badge-blue'} capitalize`, children: status.replace(/_/g, ' ') });
}
function formatDate(value) {
    return value ? new Date(value).toLocaleString() : '—';
}
function formatAmount(value, currency = 'USD') {
    return `${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}
async function review(entityType, entityId, action) {
    const { data, error } = await supabase.functions.invoke('admin-payment-action', { body: { entityType, entityId, action } });
    if (error)
        throw new Error(error.message);
    return data;
}
async function requesterReview(entityType, entityId, action) {
    const { data, error } = await supabase.functions.invoke('admin-requester-action', { body: { entityType, entityId, action } });
    if (error)
        throw new Error(error.message);
    return data;
}
async function publishRequesterTask(draftId) {
    const { data, error } = await supabase.functions.invoke('publish-requester-task', { body: { draftId } });
    if (error)
        throw new Error(error.message);
    return data;
}
export default function AdminPaymentsPage() {
    const user = useAuthStore((state) => state.user);
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deposits, setDeposits] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [requesterApplications, setRequesterApplications] = useState([]);
    const [requesterDrafts, setRequesterDrafts] = useState([]);
    const [packagePayments, setPackagePayments] = useState([]);
    const [packageStatus, setPackageStatus] = useState('');
    const [error, setError] = useState('');
    const [busyAction, setBusyAction] = useState('');
    async function load() {
        if (!user?.id || !isAdmin)
            return;
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
            if (depositResult.error)
                throw depositResult.error;
            if (payoutResult.error)
                throw payoutResult.error;
            if (appealResult.error)
                throw appealResult.error;
            if (requesterApplicationsResult.error)
                throw requesterApplicationsResult.error;
            if (requesterDraftsResult.error)
                throw requesterDraftsResult.error;
            if (packageQueueResult.error)
                throw packageQueueResult.error;
            setDeposits((depositResult.data || []).map((item) => ({ ...item, amount: Number(item.amount_usd) })));
            setPayouts((payoutResult.data || []).map((item) => ({ ...item, amount: Number(item.amount) })));
            setAppeals(appealResult.data || []);
            setRequesterApplications(requesterApplicationsResult.data || []);
            setRequesterDrafts((requesterDraftsResult.data || []).map((item) => ({ ...item, reward: Number(item.reward) })));
            setPackagePayments((packageQueueResult.data?.items || []));
        }
        catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Unable to load the admin workspace.');
        }
        finally {
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
        void Promise.resolve(supabase.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()).then(({ data, error: profileError }) => {
            if (profileError)
                throw profileError;
            setIsAdmin(Boolean(data?.is_admin));
        }).catch((profileError) => {
            setIsAdmin(false);
            setError(profileError instanceof Error ? profileError.message : 'Unable to verify admin access.');
            setLoading(false);
        });
    }, [user?.id]);
    useEffect(() => {
        if (isAdmin)
            void load();
    }, [isAdmin, packageStatus]);
    async function act(entityType, entityId, action) {
        const key = `${entityType}:${entityId}:${action}`;
        setBusyAction(key);
        try {
            await review(entityType, entityId, action);
            await load();
        }
        catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : 'Unable to apply review action.');
        }
        finally {
            setBusyAction('');
        }
    }
    async function requesterAct(entityType, entityId, action) {
        const key = `${entityType}:${entityId}:${action}`;
        setBusyAction(key);
        try {
            if (entityType === 'requester_task' && action === 'approve')
                await publishRequesterTask(entityId);
            else
                await requesterReview(entityType, entityId, action);
            await load();
        }
        catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : 'Unable to apply requester review action.');
        }
        finally {
            setBusyAction('');
        }
    }
    const stalePackages = useMemo(() => packagePayments.filter((item) => ['created', 'pending', 'processing'].includes(item.status) && Date.now() - new Date(item.created_at).getTime() > 15 * 60 * 1000).length, [packagePayments]);
    const payoutTotal = useMemo(() => payouts.reduce((total, item) => total + Number(item.amount || 0), 0), [payouts]);
    const totalAttention = deposits.length + payouts.length + appeals.length + requesterApplications.length + requesterDrafts.length + stalePackages;
    if (!user)
        return _jsx("main", { className: "container max-w-2xl py-10", children: _jsxs("section", { className: "card text-center", children: [_jsx("h1", { className: "font-display text-2xl", children: "Sign in required" }), _jsx("p", { className: "text-sm mt-3", style: { color: 'var(--text-muted)' }, children: "Sign in with an administrator account to open the operations dashboard." }), _jsx(Link, { to: "/auth", className: "btn-primary inline-flex mt-5", children: "Sign in" })] }) });
    if (loading)
        return _jsx("main", { className: "container py-10", children: _jsx("div", { className: "card text-sm", role: "status", "aria-live": "polite", style: { color: 'var(--text-muted)' }, children: "Loading the admin workspace\u2026" }) });
    if (!isAdmin)
        return _jsx("main", { className: "container max-w-2xl py-10", children: _jsxs("section", { className: "card text-center", children: [_jsx(ShieldCheck, { className: "mx-auto mb-3 text-red-600", size: 30 }), _jsx("h1", { className: "font-display text-2xl", children: "Admin access required" }), _jsx("p", { className: "text-sm mt-3", style: { color: 'var(--text-muted)' }, children: "This workspace is restricted to approved Giglify administrators." }), _jsx(Link, { to: "/dashboard", className: "btn-secondary inline-flex mt-5", children: "Return to dashboard" })] }) });
    return (_jsxs("main", { className: "container py-8 space-y-8", children: [_jsxs("header", { className: "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", "data-aos": "fade-down", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Admin workspace" }), _jsx("h1", { className: "font-display text-3xl mt-1", children: "Operations dashboard" }), _jsx("p", { className: "text-sm mt-2", style: { color: 'var(--text-muted)' }, children: "Review payments, requester access, payout readiness, and account appeals from one place." })] }), _jsx("button", { type: "button", className: "btn-secondary inline-flex items-center justify-center gap-2", onClick: () => void load(), disabled: refreshing, children: refreshing ? 'Refreshing…' : 'Refresh data' })] }), error && _jsx("div", { className: "alert alert-error", role: "alert", children: error }), _jsx("nav", { className: "flex gap-2 overflow-x-auto pb-1", "aria-label": "Admin sections", children: [['#overview', 'Overview'], ['#packages', 'Package payments'], ['#requesters', 'Requesters'], ['#payouts', 'Payouts'], ['#appeals', 'Appeals']].map(([href, label]) => _jsx("a", { href: href, className: "shrink-0 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold hover:border-brand-500 hover:text-brand-700 dark:hover:text-brand-300", children: label }, href)) }), _jsxs("section", { id: "overview", className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4", "aria-label": "Admin overview", "data-aos": "fade-up", children: [_jsxs("article", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-semibold", style: { color: 'var(--text-muted)' }, children: "Needs attention" }), _jsx("span", { className: "rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(ClipboardCheck, { size: 18 }) })] }), _jsx("p", { className: "font-display text-3xl font-bold mt-3", children: totalAttention }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: "Open review items" })] }), _jsxs("article", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-semibold", style: { color: 'var(--text-muted)' }, children: "Payout queue" }), _jsx("span", { className: "rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(Wallet, { size: 18 }) })] }), _jsx("p", { className: "font-display text-3xl font-bold mt-3", children: formatAmount(payoutTotal) }), _jsxs("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: [payouts.length, " request", payouts.length === 1 ? '' : 's', " awaiting review"] })] }), _jsxs("article", { className: "card", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-semibold", style: { color: 'var(--text-muted)' }, children: "Requester queue" }), _jsx("span", { className: "rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: _jsx(ShieldCheck, { size: 18 }) })] }), _jsx("p", { className: "font-display text-3xl font-bold mt-3", children: requesterApplications.length + requesterDrafts.length }), _jsxs("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: [requesterApplications.length, " applications \u00B7 ", requesterDrafts.length, " drafts"] })] }), _jsxs("article", { className: `card ${stalePackages ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : ''}`, children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("p", { className: "text-sm font-semibold", style: { color: 'var(--text-muted)' }, children: "Stale payments" }), _jsx("span", { className: "rounded-xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300", children: "!" })] }), _jsx("p", { className: "font-display text-3xl font-bold mt-3", children: stalePackages }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: "Open longer than 15 minutes" })] })] }), _jsxs("section", { id: "packages", className: "card scroll-mt-24", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Payments" }), _jsx("h2", { className: "font-display text-2xl mt-1", children: "Package reconciliation" }), _jsx("p", { className: "text-sm mt-1", style: { color: 'var(--text-muted)' }, children: "Read-only provider, callback, entitlement, and failure visibility for paid tiers." })] }), _jsxs("label", { className: "text-sm font-semibold sm:min-w-44", children: ["Status", _jsxs("select", { "aria-label": "Package payment status", className: "input-field mt-2 py-2", value: packageStatus, onChange: (event) => setPackageStatus(event.target.value), children: [_jsx("option", { value: "", children: "All statuses" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "processing", children: "Processing" }), _jsx("option", { value: "success", children: "Success" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "failed", children: "Failed" }), _jsx("option", { value: "cancelled", children: "Cancelled" }), _jsx("option", { value: "expired", children: "Expired" })] })] })] }), _jsxs("div", { className: "mt-5 space-y-3", children: [packagePayments.length === 0 && _jsx("p", { className: "rounded-xl border border-dashed border-[var(--border)] p-6 text-sm text-center", style: { color: 'var(--text-muted)' }, children: "No package payments match this filter." }), packagePayments.map((item) => { const attempt = [...(item.payment_attempts || [])].sort((left, right) => right.attempt_number - left.attempt_number)[0]; const isOpen = ['created', 'pending', 'processing'].includes(item.status); const isStale = isOpen && Date.now() - new Date(item.created_at).getTime() > 15 * 60 * 1000; return _jsxs("article", { className: `rounded-xl border p-4 ${isStale ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : 'border-[var(--border)]'}`, children: [_jsx("div", { className: "flex flex-wrap items-start justify-between gap-3", children: _jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("h3", { className: "font-semibold capitalize", children: [item.package_tier || 'Unknown tier', " \u00B7 ", item.provider || 'Unknown provider'] }), _jsx(StatusBadge, { status: item.status })] }), _jsxs("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: [formatAmount(item.amount, item.currency), " \u00B7 ", item.tuid || item.id, " \u00B7 ", formatDate(item.created_at)] }), _jsxs("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: ["User ", item.user_id] })] }) }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-3 mt-4 text-sm", children: [_jsxs("span", { children: ["Entitlement: ", _jsx("strong", { children: item.verification_status || '—' })] }), _jsxs("span", { children: ["Request: ", _jsx("strong", { children: attempt?.request_status || '—' })] }), _jsxs("span", { children: ["Callback: ", _jsx("strong", { children: attempt?.callback_status || '—' })] })] }), isStale && _jsx("p", { className: "text-sm font-semibold text-amber-800 dark:text-amber-200 mt-3", children: "Needs reconciliation: this payment has remained open for more than 15 minutes." }), (item.technical_error || attempt?.technical_error) && _jsx("p", { className: "alert alert-error mt-3 text-sm", children: item.technical_error || attempt?.technical_error })] }, item.id); })] })] }), _jsxs("section", { id: "requesters", className: "grid gap-6 xl:grid-cols-2 scroll-mt-24", children: [_jsxs("article", { className: "card", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Identity" }), _jsx("h2", { className: "font-display text-2xl mt-1", children: "Requester applications" })] }), _jsx(StatusBadge, { status: "review-ready" })] }), _jsxs("div", { className: "space-y-3", children: [requesterApplications.length === 0 && _jsx("p", { className: "rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center", style: { color: 'var(--text-muted)' }, children: "No requester applications ready for review." }), requesterApplications.map((item) => { const key = `requester_application:${item.id}:`; return _jsxs("div", { className: "rounded-xl border border-[var(--border)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: item.legal_name }), _jsxs("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: ["User ", item.user_id, " \u00B7 Ready ", formatDate(item.review_available_at)] })] }), _jsx(StatusBadge, { status: item.status })] }), _jsx("p", { className: "text-sm mt-3", style: { color: 'var(--text-muted)' }, children: item.task_brief }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-4", children: [_jsx("button", { type: "button", className: "btn-primary px-3 py-2 text-sm", disabled: busyAction === `${key}approve`, onClick: () => void requesterAct('requester_application', item.id, 'approve'), children: busyAction === `${key}approve` ? 'Approving…' : 'Approve requester' }), _jsx("button", { type: "button", className: "btn-secondary px-3 py-2 text-sm", disabled: busyAction === `${key}reject`, onClick: () => void requesterAct('requester_application', item.id, 'reject'), children: busyAction === `${key}reject` ? 'Rejecting…' : 'Reject' })] })] }, item.id); })] })] }), _jsxs("article", { className: "card", "data-aos": "fade-up", "data-aos-delay": "60", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Marketplace" }), _jsx("h2", { className: "font-display text-2xl mt-1", children: "Task drafts" })] }), _jsx(StatusBadge, { status: "pending_review" })] }), _jsxs("div", { className: "space-y-3", children: [requesterDrafts.length === 0 && _jsx("p", { className: "rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center", style: { color: 'var(--text-muted)' }, children: "No requester task drafts awaiting review." }), requesterDrafts.map((item) => { const approveKey = `requester_task:${item.id}:approve`; const rejectKey = `requester_task:${item.id}:reject`; return _jsxs("div", { className: "rounded-xl border border-[var(--border)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: item.title }), _jsxs("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: ["User ", item.requester_id, " \u00B7 ", item.category, " \u00B7 ", item.difficulty, " \u00B7 ", formatAmount(item.reward)] })] }), _jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: formatDate(item.created_at) })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-4", children: [_jsx("button", { type: "button", className: "btn-primary px-3 py-2 text-sm", disabled: busyAction === approveKey, onClick: () => void requesterAct('requester_task', item.id, 'approve'), children: busyAction === approveKey ? 'Publishing…' : 'Approve and publish' }), _jsx("button", { type: "button", className: "btn-secondary px-3 py-2 text-sm", disabled: busyAction === rejectKey, onClick: () => void requesterAct('requester_task', item.id, 'reject'), children: busyAction === rejectKey ? 'Rejecting…' : 'Reject' })] })] }, item.id); })] })] })] }), _jsxs("section", { id: "payouts", className: "grid gap-6 xl:grid-cols-2 scroll-mt-24", children: [_jsxs("article", { className: "card", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Verification" }), _jsx("h2", { className: "font-display text-2xl mt-1", children: "Verification deposits" })] }), _jsx(StatusBadge, { status: "held" })] }), _jsxs("div", { className: "space-y-3", children: [deposits.length === 0 && _jsx("p", { className: "rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center", style: { color: 'var(--text-muted)' }, children: "No verification deposits awaiting review." }), deposits.map((item) => { const approveKey = `verification_deposit:${item.id}:approve`; const rejectKey = `verification_deposit:${item.id}:reject`; return _jsxs("div", { className: "rounded-xl border border-[var(--border)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("h3", { className: "font-semibold", children: [item.method || 'Provider', " \u00B7 ", formatAmount(item.amount)] }), _jsxs("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: ["User ", item.user_id, " \u00B7 ", formatDate(item.created_at)] })] }), _jsx(StatusBadge, { status: item.status })] }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsxs("button", { type: "button", "aria-label": "Approve verification", className: "btn-primary inline-flex items-center gap-2 px-3 py-2 text-sm", disabled: busyAction === approveKey, onClick: () => void act('verification_deposit', item.id, 'approve'), children: [_jsx(Check, { size: 16 }), " Approve"] }), _jsxs("button", { type: "button", "aria-label": "Reject verification", className: "btn-secondary inline-flex items-center gap-2 px-3 py-2 text-sm", disabled: busyAction === rejectKey, onClick: () => void act('verification_deposit', item.id, 'reject'), children: [_jsx(X, { size: 16 }), " Reject"] })] })] }, item.id); })] })] }), _jsxs("article", { className: "card", "data-aos": "fade-up", "data-aos-delay": "60", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Payouts" }), _jsx("h2", { className: "font-display text-2xl mt-1", children: "Payout requests" })] }), _jsx(StatusBadge, { status: "requested" })] }), _jsxs("div", { className: "space-y-3", children: [payouts.length === 0 && _jsx("p", { className: "rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center", style: { color: 'var(--text-muted)' }, children: "No payout requests awaiting review." }), payouts.map((item) => { const approveKey = `payout_request:${item.id}:approve`; const rejectKey = `payout_request:${item.id}:reject`; const paidKey = `payout_request:${item.id}:mark_paid`; return _jsxs("div", { className: "rounded-xl border border-[var(--border)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-semibold", children: formatAmount(item.amount) }), _jsxs("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: ["User ", item.user_id, " \u00B7 ", formatDate(item.created_at)] })] }), _jsx(StatusBadge, { status: item.status })] }), _jsxs("div", { className: "flex flex-wrap gap-2 mt-4", children: [_jsx("button", { type: "button", className: "btn-primary px-3 py-2 text-sm", disabled: busyAction === approveKey, onClick: () => void act('payout_request', item.id, 'approve'), children: busyAction === approveKey ? 'Approving…' : 'Approve' }), _jsx("button", { type: "button", className: "btn-secondary px-3 py-2 text-sm", disabled: busyAction === rejectKey, onClick: () => void act('payout_request', item.id, 'reject'), children: busyAction === rejectKey ? 'Rejecting…' : 'Reject' }), _jsx("button", { type: "button", className: "btn-secondary px-3 py-2 text-sm", disabled: busyAction === paidKey, onClick: () => void act('payout_request', item.id, 'mark_paid'), children: busyAction === paidKey ? 'Saving…' : 'Mark paid' })] })] }, item.id); })] })] })] }), _jsxs("section", { id: "appeals", className: "card scroll-mt-24", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex items-start justify-between gap-3 mb-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Accounts" }), _jsx("h2", { className: "font-display text-2xl mt-1", children: "Profile edit appeals" })] }), _jsx(StatusBadge, { status: "pending" })] }), _jsxs("div", { className: "space-y-3", children: [appeals.length === 0 && _jsx("p", { className: "rounded-xl border border-dashed border-[var(--border)] p-5 text-sm text-center", style: { color: 'var(--text-muted)' }, children: "No profile appeals awaiting review." }), appeals.map((item) => { const approveKey = `profile_edit_appeal:${item.id}:approve`; const rejectKey = `profile_edit_appeal:${item.id}:reject`; return _jsxs("div", { className: "rounded-xl border border-[var(--border)] p-4", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold", children: ["User ", item.user_id] }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: formatDate(item.created_at) })] }), _jsx(StatusBadge, { status: item.status })] }), _jsx("p", { className: "text-sm mt-3", style: { color: 'var(--text-muted)' }, children: item.reason || 'No reason supplied.' }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx("button", { type: "button", className: "btn-primary px-3 py-2 text-sm", disabled: busyAction === approveKey, onClick: () => void act('profile_edit_appeal', item.id, 'approve'), children: busyAction === approveKey ? 'Approving…' : 'Approve' }), _jsx("button", { type: "button", className: "btn-secondary px-3 py-2 text-sm", disabled: busyAction === rejectKey, onClick: () => void act('profile_edit_appeal', item.id, 'reject'), children: busyAction === rejectKey ? 'Rejecting…' : 'Reject' })] })] }, item.id); })] })] })] }));
}
//# sourceMappingURL=AdminPayments.js.map