import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { useTheme } from '../context/ThemeContext';
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
export default function AdminPaymentsPage() {
    const { theme } = useTheme();
    const [deposits, setDeposits] = useState([]);
    const [payouts, setPayouts] = useState([]);
    const [appeals, setAppeals] = useState([]);
    const [requesterApplications, setRequesterApplications] = useState([]);
    const [requesterDrafts, setRequesterDrafts] = useState([]);
    const [error, setError] = useState('');
    async function load() {
        const [depositResult, payoutResult, appealResult, requesterApplicationsResult, requesterDraftsResult] = await Promise.all([
            supabase.from('verification_deposits').select('id, user_id, status, created_at, amount_usd, method').in('status', ['pending', 'held']).order('created_at', { ascending: true }),
            supabase.from('payout_requests').select('id, user_id, status, created_at, amount').in('status', ['requested', 'under_review', 'approved']).order('created_at', { ascending: true }),
            supabase.from('profile_edit_appeals').select('id, user_id, status, created_at, reason').eq('status', 'pending').order('created_at', { ascending: true }),
            supabase.from('requester_applications').select('id, user_id, status, submitted_at, legal_name, task_brief, review_available_at').in('status', ['review-ready']).order('submitted_at', { ascending: true }),
            supabase.from('requester_task_drafts').select('id, requester_id, status, created_at, title, category, difficulty, reward').eq('status', 'pending_review').order('created_at', { ascending: true }),
        ]);
        if (depositResult.error)
            throw depositResult.error;
        if (payoutResult.error)
            throw payoutResult.error;
        if (appealResult.error)
            throw appealResult.error;
        setDeposits((depositResult.data || []).map((item) => ({ ...item, amount: Number(item.amount_usd) })));
        setPayouts((payoutResult.data || []).map((item) => ({ ...item, amount: Number(item.amount) })));
        setAppeals(appealResult.data || []);
        if (requesterApplicationsResult.error)
            throw requesterApplicationsResult.error;
        if (requesterDraftsResult.error)
            throw requesterDraftsResult.error;
        setRequesterApplications(requesterApplicationsResult.data || []);
        setRequesterDrafts((requesterDraftsResult.data || []).map((item) => ({ ...item, reward: Number(item.reward) })));
    }
    useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : 'Unable to load payment reviews.')); }, []);
    async function act(entityType, entityId, action) {
        setError('');
        try {
            await review(entityType, entityId, action);
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to apply review action.');
        }
    }
    async function requesterAct(entityType, entityId, action) {
        setError('');
        try {
            await requesterReview(entityType, entityId, action);
            await load();
        }
        catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to apply requester review action.');
        }
    }
    return (_jsx("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: _jsxs("main", { className: "container py-8", children: [_jsx("h1", { className: "font-display text-2xl font-bold mb-2", children: "Payment Reviews" }), _jsx("p", { className: `mb-8 text-sm ${theme === 'dark' ? 'text-stone-300' : 'text-stone-600'}`, children: "Approve verification deposits and payout requests. Every action is audited." }), error && _jsx("div", { className: "alert alert-error mb-6", children: error }), _jsxs("section", { className: "card mb-8", "data-aos": "fade-up", children: [_jsx("h2", { className: "font-display text-xl mb-4", children: "Requester KYC applications" }), _jsxs("div", { className: "space-y-3", children: [requesterApplications.length === 0 && _jsx("p", { className: "text-sm opacity-70", children: "No requester applications ready for review." }), requesterApplications.map((item) => _jsxs("div", { className: "rounded-lg border border-sand-200 dark:border-stone-600 p-4", children: [_jsxs("p", { className: "font-semibold", children: [item.legal_name, " \u00B7 User ", item.user_id] }), _jsxs("p", { className: "text-xs opacity-70 mt-1", children: ["Review ready ", new Date(item.review_available_at).toLocaleString()] }), _jsx("p", { className: "text-sm mt-3", children: item.task_brief }), _jsxs("div", { className: "flex gap-2 mt-3", children: [_jsx("button", { className: "btn-primary px-3 py-2", onClick: () => requesterAct('requester_application', item.id, 'approve'), children: "Approve requester" }), _jsx("button", { className: "btn-secondary px-3 py-2", onClick: () => requesterAct('requester_application', item.id, 'reject'), children: "Reject" })] })] }, item.id))] })] }), _jsxs("section", { className: "card mb-8", "data-aos": "fade-up", children: [_jsx("h2", { className: "font-display text-xl mb-4", children: "Requester task drafts" }), _jsxs("div", { className: "space-y-3", children: [requesterDrafts.length === 0 && _jsx("p", { className: "text-sm opacity-70", children: "No requester task drafts awaiting review." }), requesterDrafts.map((item) => _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: item.title }), _jsxs("p", { className: "text-xs opacity-70", children: ["User ", item.requester_id, " \u00B7 ", item.category, " \u00B7 ", item.difficulty, " \u00B7 $", item.reward.toFixed(2)] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn-primary px-3 py-2", onClick: () => requesterAct('requester_task', item.id, 'approve'), children: "Approve" }), _jsx("button", { className: "btn-secondary px-3 py-2", onClick: () => requesterAct('requester_task', item.id, 'reject'), children: "Reject" })] })] }, item.id))] })] }), _jsxs("section", { className: "card mb-8", children: [_jsx("h2", { className: "font-display text-xl mb-4", children: "Verification deposits" }), _jsxs("div", { className: "space-y-3", children: [deposits.length === 0 && _jsx("p", { className: "text-sm opacity-70", children: "No verification deposits awaiting review." }), deposits.map((item) => _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold", children: [item.method, " \u00B7 $", item.amount?.toFixed(2)] }), _jsxs("p", { className: "text-xs opacity-70", children: ["User ", item.user_id, " \u00B7 ", new Date(item.created_at).toLocaleString()] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { "aria-label": "Approve verification", className: "btn-primary px-3 py-2 rounded-lg", onClick: () => act('verification_deposit', item.id, 'approve'), children: _jsx(Check, { size: 16 }) }), _jsx("button", { "aria-label": "Reject verification", className: "btn-secondary px-3 py-2 rounded-lg", onClick: () => act('verification_deposit', item.id, 'reject'), children: _jsx(X, { size: 16 }) })] })] }, item.id))] })] }), _jsxs("section", { className: "card mt-8", children: [_jsx("h2", { className: "font-display text-xl mb-4", children: "Profile edit appeals" }), _jsxs("div", { className: "space-y-3", children: [appeals.length === 0 && _jsx("p", { className: "text-sm opacity-70", children: "No profile appeals awaiting review." }), appeals.map((item) => _jsxs("div", { className: "rounded-lg border border-sand-200 dark:border-stone-600 p-4", children: [_jsxs("p", { className: "text-xs opacity-70", children: ["User ", item.user_id, " \u00B7 ", new Date(item.created_at).toLocaleString()] }), _jsx("p", { className: "text-sm mt-2", children: item.reason }), _jsxs("div", { className: "flex gap-2 mt-3", children: [_jsx("button", { className: "btn-primary px-3 py-2 rounded-lg", onClick: () => act('profile_edit_appeal', item.id, 'approve'), children: "Approve" }), _jsx("button", { className: "btn-secondary px-3 py-2 rounded-lg", onClick: () => act('profile_edit_appeal', item.id, 'reject'), children: "Reject" })] })] }, item.id))] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { className: "font-display text-xl mb-4", children: "Payout requests" }), _jsxs("div", { className: "space-y-3", children: [payouts.length === 0 && _jsx("p", { className: "text-sm opacity-70", children: "No payout requests awaiting review." }), payouts.map((item) => _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-200 dark:border-stone-600 p-4", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-semibold", children: ["$", item.amount?.toFixed(2), " \u00B7 ", item.status] }), _jsxs("p", { className: "text-xs opacity-70", children: ["User ", item.user_id, " \u00B7 ", new Date(item.created_at).toLocaleString()] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "btn-primary px-3 py-2 rounded-lg", onClick: () => act('payout_request', item.id, 'approve'), children: "Approve" }), _jsx("button", { className: "btn-secondary px-3 py-2 rounded-lg", onClick: () => act('payout_request', item.id, 'reject'), children: "Reject" }), _jsx("button", { className: "btn-secondary px-3 py-2 rounded-lg", onClick: () => act('payout_request', item.id, 'mark_paid'), children: "Mark paid" })] })] }, item.id))] })] })] }) }));
}
//# sourceMappingURL=AdminPayments.js.map