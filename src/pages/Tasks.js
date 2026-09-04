import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Laptop, Smartphone, Globe2 } from 'lucide-react';
import { TaskListSkeleton } from '../components/ui/Skeleton';
import { useAuthStore } from '../store/authStore';
import { getProfileCompletion, PROFILE_TASK_LIMIT_THRESHOLD, DAILY_TASK_LIMIT_BELOW_THRESHOLD } from '../utils/profileCompletion';
// Demo data removed. Real tasks should be fetched from Supabase.
const tasks = [];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const DEVICES = [
    { value: 'any', label: 'Any device', icon: Globe2 },
    { value: 'mobile', label: 'Mobile', icon: Smartphone },
    { value: 'desktop', label: 'Desktop', icon: Laptop },
];
const PAY_BANDS = [
    { label: 'Under $5', test: (r) => r < 5 },
    { label: '$5 – $10', test: (r) => r >= 5 && r <= 10 },
    { label: 'Over $10', test: (r) => r > 10 },
];
export default function TasksPage() {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [difficulty, setDifficulty] = useState(new Set());
    const [device, setDevice] = useState(new Set());
    const [payBand, setPayBand] = useState(new Set());
    useEffect(() => {
        const t = setTimeout(() => setLoading(false), 450);
        return () => clearTimeout(t);
    }, []);
    const completion = getProfileCompletion(user);
    const gated = completion < PROFILE_TASK_LIMIT_THRESHOLD;
    const toggle = (set, value, setter) => {
        const next = new Set(set);
        next.has(value) ? next.delete(value) : next.add(value);
        setter(next);
    };
    const filtered = useMemo(() => {
        return tasks.filter((task) => {
            const q = search.trim().toLowerCase();
            if (q && !task.title.toLowerCase().includes(q) && !task.description.toLowerCase().includes(q))
                return false;
            if (difficulty.size && !difficulty.has(task.difficulty))
                return false;
            if (device.size && !device.has(task.device))
                return false;
            if (payBand.size) {
                const matches = PAY_BANDS.filter((b) => payBand.has(b.label)).some((b) => b.test(task.reward));
                if (!matches)
                    return false;
            }
            return true;
        });
    }, [search, difficulty, device, payBand]);
    return (_jsx("div", { className: "min-h-screen", style: { background: 'var(--bg)', color: 'var(--text)' }, children: _jsxs("main", { className: "container py-8", children: [_jsx("h1", { className: "font-display text-2xl mb-1", "data-aos": "fade-down", children: "Available Tasks" }), _jsxs("p", { className: "text-sm mb-6", style: { color: 'var(--text-muted)' }, children: [tasks.length, " tasks available \u2014 real tasks appear here once your task list is imported."] }), gated && (_jsxs("div", { className: "alert alert-info text-sm flex flex-wrap items-center justify-between gap-2", "data-aos": "fade-in", children: [_jsxs("span", { children: ["Your profile is ", completion, "% complete. Below ", PROFILE_TASK_LIMIT_THRESHOLD, "%, you're limited to", ' ', DAILY_TASK_LIMIT_BELOW_THRESHOLD, " task", DAILY_TASK_LIMIT_BELOW_THRESHOLD === 1 ? '' : 's', "/day."] }), _jsx(Link, { to: "/profile", className: "btn-secondary text-xs px-3 py-1.5 whitespace-nowrap", children: "Complete profile" })] })), _jsxs("div", { className: "relative mb-4", "data-aos": "fade-up", children: [_jsx(Search, { size: 18, className: "absolute left-3 top-1/2 -translate-y-1/2", style: { color: 'var(--text-muted)' } }), _jsx("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Search tasks by title or description\u2026", className: "input-field pl-10" })] }), _jsxs("div", { className: "flex flex-wrap gap-4 mb-6", "data-aos": "fade-up", "data-aos-delay": "60", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1.5", style: { color: 'var(--text-muted)' }, children: "Difficulty" }), _jsx("div", { className: "flex gap-1.5 flex-wrap", children: DIFFICULTIES.map((d) => (_jsx("button", { onClick: () => toggle(difficulty, d, setDifficulty), className: `text-xs px-3 py-1.5 rounded-full border font-semibold capitalize transition-colors ${difficulty.has(d) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`, children: d }, d))) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1.5", style: { color: 'var(--text-muted)' }, children: "Pay" }), _jsx("div", { className: "flex gap-1.5 flex-wrap", children: PAY_BANDS.map((b) => (_jsx("button", { onClick: () => toggle(payBand, b.label, setPayBand), className: `text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${payBand.has(b.label) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`, children: b.label }, b.label))) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold mb-1.5", style: { color: 'var(--text-muted)' }, children: "Device" }), _jsx("div", { className: "flex gap-1.5 flex-wrap", children: DEVICES.map((d) => (_jsxs("button", { onClick: () => toggle(device, d.value, setDevice), className: `text-xs px-3 py-1.5 rounded-full border font-semibold flex items-center gap-1 transition-colors ${device.has(d.value) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`, children: [_jsx(d.icon, { size: 12 }), " ", d.label] }, d.value))) })] })] }), loading ? (_jsx(TaskListSkeleton, { count: 4 })) : filtered.length === 0 ? (_jsx("div", { className: "card text-center py-10", style: { color: 'var(--text-muted)' }, children: "No tasks match your filters. Try clearing a few." })) : (_jsx("div", { className: "grid gap-4", children: filtered.map((task, index) => (_jsx("div", { className: "card hover:shadow-md cursor-pointer transition-all transform hover:scale-[1.01]", "data-aos": "fade-up", "data-aos-delay": Math.min(index * 60, 300), children: _jsxs("div", { className: "flex justify-between items-start gap-4", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2 flex-wrap", children: [_jsx("h3", { className: "font-semibold", children: task.title }), _jsx("span", { className: `badge ${task.category === 'academic' ? 'badge-blue' : 'badge-purple'}`, children: task.category }), _jsx("span", { className: `badge ${task.difficulty === 'easy' ? 'badge-green' : task.difficulty === 'medium' ? 'badge-yellow' : 'badge-red'}`, children: task.difficulty }), task.device !== 'any' && (_jsxs("span", { className: "badge badge-blue flex items-center gap-1", children: [task.device === 'desktop' ? _jsx(Laptop, { size: 11 }) : _jsx(Smartphone, { size: 11 }), " ", task.device] }))] }), _jsx("p", { className: "text-sm mb-2", style: { color: 'var(--text-muted)' }, children: task.description }), _jsxs("div", { className: "text-xs", style: { color: 'var(--text-muted)' }, children: ["\u23F1\uFE0F ", task.estimatedTime, " min"] })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsxs("p", { className: "font-display text-2xl font-bold text-green-600 dark:text-green-400", children: ["+$", task.reward] }), _jsxs("button", { disabled: gated, className: "mt-2 btn-primary text-sm px-3 py-1 flex items-center gap-1 ml-auto disabled:opacity-50 disabled:cursor-not-allowed", children: ["Start ", _jsx(ArrowRight, { size: 14 })] })] })] }) }, task.id))) }))] }) }));
}
//# sourceMappingURL=Tasks.js.map