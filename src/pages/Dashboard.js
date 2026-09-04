import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import { StatCardSkeleton } from '../components/ui/Skeleton';
const MOCK_TASKS = [
    {
        id: '1',
        title: 'Research Paper Proofreading',
        description: 'Review academic paper for grammar and structure',
        category: 'academic',
        reward: 5,
        estimatedTime: 45,
        difficulty: 'easy',
        status: 'available',
    },
    {
        id: '2',
        title: 'RLHF Model Ranking',
        description: 'Rank AI responses for quality and helpfulness',
        category: 'rlhf',
        reward: 8,
        estimatedTime: 30,
        difficulty: 'medium',
        status: 'available',
    },
    {
        id: '3',
        title: 'Statistical Data Audit',
        description: 'Verify statistical calculations in research',
        category: 'academic',
        reward: 10,
        estimatedTime: 60,
        difficulty: 'hard',
        requiresDesktop: true,
        status: 'available',
    },
];
export default function DashboardPage() {
    useTheme();
    const { user } = useAuthStore();
    const [tasks, setTasks] = useState([]);
    const [completedToday] = useState(0);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        // Simulated fetch — replace with a Supabase query against `tasks`
        // (see supabase/schema.sql) once the DB is wired up.
        const t = setTimeout(() => {
            setTasks(MOCK_TASKS);
            setLoading(false);
        }, 500);
        return () => clearTimeout(t);
    }, []);
    return (_jsx("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: _jsxs("main", { className: "container py-8", children: [_jsx("div", { className: "card mb-8 animate-in", "data-aos": "fade-up", children: _jsx("div", { className: "flex justify-between items-start", children: _jsxs("div", { children: [_jsxs("h2", { className: "font-display text-2xl mb-2", children: ["Welcome, ", user?.firstName, "! \uD83D\uDC4B"] }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "You're on track. Keep completing tasks to earn more rewards." })] }) }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: loading ? (_jsxs(_Fragment, { children: [_jsx(StatCardSkeleton, {}), _jsx(StatCardSkeleton, {}), _jsx(StatCardSkeleton, {})] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card animate-in", "data-aos": "fade-up", children: [_jsx("h3", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-muted)' }, children: "Total Earnings" }), _jsxs("p", { className: "font-display text-3xl font-bold", children: ["$", user?.balance || 0, ".00"] }), _jsx("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: "USD" })] }), _jsxs("div", { className: "card animate-in", "data-aos": "fade-up", "data-aos-delay": "80", children: [_jsx("h3", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-muted)' }, children: "Completed Today" }), _jsx("p", { className: "font-display text-3xl font-bold", children: completedToday }), _jsx("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: "tasks" })] }), _jsxs("div", { className: "card animate-in", "data-aos": "fade-up", "data-aos-delay": "160", children: [_jsx("h3", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-muted)' }, children: "Tier Status" }), _jsx("p", { className: "font-display text-3xl font-bold capitalize", children: user?.subscription }), _jsx("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: "Membership" })] })] })) })] }) }));
}
//# sourceMappingURL=Dashboard.js.map