import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock3, Eye, ListChecks, RotateCcw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { fetchTaskSubmissionProgress } from '../lib/taskQuestionsApi';
import { getTaskStatusMeta, summarizeTaskSubmissions } from '../lib/taskTracking';
const FILTERS = [
    { value: 'all', label: 'All tasks' },
    { value: 'in-progress', label: 'Started' },
    { value: 'submitted', label: 'Under review' },
    { value: 'approved', label: 'Completed' },
    { value: 'rejected', label: 'Needs attention' },
];
function formatDate(value) {
    if (!value)
        return 'No date available';
    return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(value));
}
function Stat({ icon: Icon, label, value, tone }) {
    return (_jsxs("div", { className: "card flex items-center gap-3", children: [_jsx("div", { className: `w-10 h-10 rounded-xl flex items-center justify-center ${tone}`, children: _jsx(Icon, { size: 19 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold leading-none", children: value }), _jsx("p", { className: "text-xs mt-1", style: { color: 'var(--text-muted)' }, children: label })] })] }));
}
export default function TaskTrackingPage() {
    const user = useAuthStore((state) => state.user);
    const [submissions, setSubmissions] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        if (!user)
            return;
        let cancelled = false;
        setLoading(true);
        fetchTaskSubmissionProgress(user.id).then(({ submissions: rows, error: fetchError }) => {
            if (cancelled)
                return;
            setSubmissions(rows);
            setError(fetchError?.message ?? null);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [user?.id]);
    const summary = useMemo(() => summarizeTaskSubmissions(submissions), [submissions]);
    const visible = useMemo(() => filter === 'all' ? submissions : submissions.filter((submission) => submission.status === filter), [filter, submissions]);
    return (_jsx("div", { className: "min-h-screen", style: { background: 'var(--bg)', color: 'var(--text)' }, children: _jsxs("main", { className: "container py-8", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 mb-6", "data-aos": "fade-down", children: [_jsxs("div", { children: [_jsx("h1", { className: "font-display text-2xl mb-1", children: "My task progress" }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "Follow every task from your first answer to final review." })] }), _jsxs(Link, { to: "/tasks", className: "btn-primary inline-flex items-center gap-2 text-sm", children: [_jsx(ListChecks, { size: 16 }), " Find tasks"] })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8", "data-aos": "fade-up", children: [_jsx(Stat, { icon: ListChecks, label: "All tracked tasks", value: summary.total, tone: "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300" }), _jsx(Stat, { icon: Clock3, label: "Started", value: summary.started, tone: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" }), _jsx(Stat, { icon: Eye, label: "Under review", value: summary.underReview, tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" }), _jsx(Stat, { icon: CheckCircle2, label: "Completed", value: summary.completed, tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" })] }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-2 mb-5", role: "tablist", "aria-label": "Filter task progress", children: FILTERS.map((item) => (_jsx("button", { type: "button", role: "tab", "aria-selected": filter === item.value, onClick: () => setFilter(item.value), className: `shrink-0 text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${filter === item.value ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`, children: item.label }, item.value))) }), error && _jsx("div", { className: "alert alert-error mb-5 text-sm", children: "We could not load your task history. Please refresh and try again." }), loading ? (_jsx("div", { className: "grid gap-4", children: [1, 2, 3].map((item) => _jsxs("div", { className: "card space-y-3", children: [_jsx(Skeleton, { className: "h-5 w-2/3" }), _jsx(Skeleton, { className: "h-3 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-full" })] }, item)) })) : visible.length === 0 ? (_jsxs("div", { className: "card text-center py-12", children: [_jsx(ListChecks, { className: "mx-auto mb-3 text-brand-500", size: 34 }), _jsx("h2", { className: "font-semibold mb-1", children: filter === 'all' ? 'No tracked tasks yet' : `No ${FILTERS.find((item) => item.value === filter)?.label.toLowerCase()} tasks` }), _jsx("p", { className: "text-sm mb-5", style: { color: 'var(--text-muted)' }, children: "Start a task and it will appear here automatically." }), _jsxs(Link, { to: "/tasks", className: "btn-secondary inline-flex items-center gap-2 text-sm", children: ["Browse available tasks ", _jsx(ArrowRight, { size: 15 })] })] })) : (_jsx("div", { className: "grid gap-4", children: visible.map((submission, index) => {
                        const meta = getTaskStatusMeta(submission.status);
                        const taskCode = submission.task?.taskCode;
                        const reward = submission.rewardPaid ?? submission.rewardApproved ?? submission.task?.reward;
                        return (_jsxs("article", { className: "card", "data-aos": "fade-up", "data-aos-delay": index * 40, children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-1", children: [_jsx("h2", { className: "font-semibold", children: submission.task?.title ?? 'Task unavailable' }), _jsx("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${meta.className}`, children: meta.label })] }), _jsxs("p", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: [taskCode ?? 'Giglify task', " \u00B7 ", submission.task?.category ?? 'General', " \u00B7 Started ", formatDate(submission.startedAt)] })] }), reward != null && _jsxs("span", { className: "font-semibold text-sm text-brand-600 dark:text-brand-300", children: ["$", Number(reward).toFixed(2)] })] }), _jsx("p", { className: "text-sm mt-4", style: { color: 'var(--text-muted)' }, children: meta.description }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t", style: { borderColor: 'var(--border)' }, children: [_jsx("span", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: submission.status === 'approved' ? `Completed ${formatDate(submission.completedAt)}` : submission.status === 'submitted' ? 'Submitted for review' : `Last started ${formatDate(submission.startedAt)}` }), taskCode && submission.status !== 'submitted' && submission.status !== 'approved' && (_jsxs(Link, { to: `/tasks/${encodeURIComponent(taskCode)}`, className: "btn-secondary inline-flex items-center gap-2 text-xs", children: [submission.status === 'rejected' ? _jsx(RotateCcw, { size: 14 }) : _jsx(ArrowRight, { size: 14 }), submission.status === 'rejected' ? 'Try again' : 'Continue'] }))] })] }, submission.id));
                    }) }))] }) }));
}
//# sourceMappingURL=TaskTracking.js.map