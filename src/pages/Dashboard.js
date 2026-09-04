import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ArrowRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { StatCardSkeleton, TaskListSkeleton } from '../components/ui/Skeleton';
import { fetchTasks } from '../lib/taskQuestionsApi';
export default function DashboardPage() {
    useTheme();
    const { user } = useAuthStore();
    const [tasks, setTasks] = useState([]);
    const [completedToday] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let cancelled = false;
        fetchTasks().then(({ tasks: fetchedTasks, error: fetchError }) => {
            if (cancelled)
                return;
            setTasks(fetchedTasks.slice(0, 3));
            setError(fetchError?.message ?? null);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, []);
    return (_jsx("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: _jsxs("main", { className: "container py-8", children: [_jsx("div", { className: "card mb-8 animate-in", "data-aos": "fade-up", children: _jsx("div", { className: "flex justify-between items-start", children: _jsxs("div", { children: [_jsxs("h2", { className: "font-display text-2xl mb-2", children: ["Welcome, ", user?.firstName, "! \uD83D\uDC4B"] }), _jsx("p", { className: "text-sm", style: { color: 'var(--text-muted)' }, children: "You're on track. Keep completing tasks to earn more rewards." })] }) }) }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8", children: loading ? (_jsxs(_Fragment, { children: [_jsx(StatCardSkeleton, {}), _jsx(StatCardSkeleton, {}), _jsx(StatCardSkeleton, {})] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "card animate-in", "data-aos": "fade-up", children: [_jsx("h3", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-muted)' }, children: "Total Earnings" }), _jsxs("p", { className: "font-display text-3xl font-bold", children: ["$", user?.balance || 0, ".00"] }), _jsx("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: "USD" })] }), _jsxs("div", { className: "card animate-in", "data-aos": "fade-up", "data-aos-delay": "80", children: [_jsx("h3", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-muted)' }, children: "Completed Today" }), _jsx("p", { className: "font-display text-3xl font-bold", children: completedToday }), _jsx("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: "tasks" })] }), _jsxs("div", { className: "card animate-in", "data-aos": "fade-up", "data-aos-delay": "160", children: [_jsx("h3", { className: "text-sm font-semibold mb-2", style: { color: 'var(--text-muted)' }, children: "Tier Status" }), _jsx("p", { className: "font-display text-3xl font-bold capitalize", children: user?.subscription }), _jsx("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: "Membership" })] })] })) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "font-display text-2xl", children: "Available Tasks" }), _jsxs(Link, { to: "/tasks", className: "text-sm font-semibold text-brand-600 dark:text-brand-300 flex items-center gap-1", children: ["See all ", _jsx(ArrowRight, { size: 14 })] })] }), loading ? (_jsx(TaskListSkeleton, { count: 3 })) : error ? (_jsxs("div", { className: "alert alert-error text-sm", children: ["Unable to load tasks: ", error] })) : tasks.length === 0 ? (_jsx("div", { className: "card text-sm", style: { color: 'var(--text-muted)' }, children: "No tasks are available right now." })) : (_jsx("div", { className: "grid gap-4", children: tasks.map((task, index) => (_jsx("div", { className: "card hover:shadow-md transition-all transform hover:scale-[1.01] animate-in", "data-aos": "fade-up", "data-aos-delay": index * 80, children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2 flex-wrap", children: [_jsx("h3", { className: "font-semibold", children: task.title }), _jsx("span", { className: `badge ${task.category === 'academic' ? 'badge-blue' : 'badge-purple'}`, children: task.category }), _jsx("span", { className: `badge ${task.difficulty === 'easy' ? 'badge-green' : task.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'}`, children: task.difficulty })] }), _jsx("p", { className: "text-sm mb-2", style: { color: 'var(--text-muted)' }, children: task.description }), _jsxs("div", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: ["\u23F1\uFE0F ", task.estimatedTime, " min"] })] }), _jsxs("div", { className: "text-right ml-4", children: [_jsxs("p", { className: "font-display text-2xl font-bold text-green-600 dark:text-green-400", children: ["+$", task.reward] }), task.taskCode ? (_jsxs(Link, { to: `/tasks/${encodeURIComponent(task.taskCode)}`, className: "mt-2 btn-primary text-sm px-3 py-1 flex items-center gap-1 ml-auto", children: ["Start ", _jsx(ArrowRight, { size: 14 })] })) : null] })] }) }, task.id))) }))] })] }) }));
}
//# sourceMappingURL=Dashboard.js.map