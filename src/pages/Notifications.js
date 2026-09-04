import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { CheckCircle2, DollarSign, ListChecks } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
const DEMO_NOTIFICATIONS = [
    { id: '1', icon: DollarSign, title: 'Task reward received', detail: '+$5.00 for "Research Paper Proofreading"', time: '2h ago' },
    { id: '2', icon: ListChecks, title: 'New tasks available', detail: '3 new RLHF tasks match your skills', time: '6h ago' },
    { id: '3', icon: CheckCircle2, title: 'Profile milestone', detail: "You're 55% of the way to unlocking unlimited tasks", time: '1d ago' },
];
export default function NotificationsPage() {
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 400);
        return () => clearTimeout(t);
    }, []);
    return (_jsx("div", { className: "min-h-screen", style: { background: 'var(--bg)', color: 'var(--text)' }, children: _jsxs("main", { className: "container py-8 max-w-2xl", children: [_jsx("h1", { className: "font-display text-2xl mb-6", "data-aos": "fade-down", children: "Notifications" }), loading ? (_jsx("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, i) => (_jsxs("div", { className: "card flex gap-3 items-center", children: [_jsx(Skeleton, { className: "h-10 w-10 rounded-full shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(Skeleton, { className: "h-3 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-2/3" })] })] }, i))) })) : (_jsx("div", { className: "space-y-3", children: DEMO_NOTIFICATIONS.map((n, i) => (_jsxs("div", { className: "card flex gap-3 items-start", "data-aos": "fade-up", "data-aos-delay": i * 60, children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0", children: _jsx(n.icon, { size: 18 }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-sm", children: n.title }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: n.detail })] }), _jsx("span", { className: "text-xs shrink-0", style: { color: 'var(--text-muted)' }, children: n.time })] }, n.id))) }))] }) }));
}
//# sourceMappingURL=Notifications.js.map