import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { CheckCircle2, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { getProfileCompletion, PROFILE_TASK_LIMIT_THRESHOLD } from '../utils/profileCompletion';
const SKILL_OPTIONS = ['Writing', 'Data labeling', 'Research', 'Translation', 'Coding', 'Design'];
export default function ProfileCompletionPage() {
    const { user, setUser } = useAuthStore();
    const [form, setForm] = useState({
        phone: user?.phone || '',
        country: user?.country || '',
        bio: user?.bio || '',
        skills: user?.skills || [],
        payoutMethodAdded: user?.payoutMethodAdded || false,
    });
    const [saved, setSaved] = useState(false);
    const preview = { ...user, ...form };
    const completion = getProfileCompletion(preview);
    const toggleSkill = (skill) => {
        setForm((f) => ({
            ...f,
            skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
        }));
    };
    const handleSave = (e) => {
        e.preventDefault();
        if (!user)
            return;
        // TODO: persist to Supabase `profiles` table (see supabase/schema.sql)
        // once the DB is connected — for now this only updates local state.
        setUser({ ...user, ...form });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };
    return (_jsx("div", { className: "min-h-screen", style: { background: 'var(--bg)', color: 'var(--text)' }, children: _jsxs("main", { className: "container py-8 max-w-2xl", children: [_jsx("h1", { className: "font-display text-2xl mb-1", "data-aos": "fade-down", children: "Complete your profile" }), _jsxs("p", { className: "text-sm mb-6", style: { color: 'var(--text-muted)' }, children: ["Reach ", PROFILE_TASK_LIMIT_THRESHOLD, "% to unlock unlimited daily tasks."] }), _jsxs("div", { className: "card mb-6", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm font-semibold flex items-center gap-2", children: [_jsx(UserIcon, { size: 16 }), " Profile strength"] }), _jsxs("span", { className: "text-sm font-bold", children: [completion, "%"] })] }), _jsx("div", { className: "w-full h-2.5 rounded-full overflow-hidden", style: { background: 'var(--border)' }, children: _jsx("div", { className: "h-full rounded-full transition-all duration-500 ease-out", style: { width: `${completion}%`, background: completion >= PROFILE_TASK_LIMIT_THRESHOLD ? '#22c55e' : 'var(--accent)' } }) }), completion < PROFILE_TASK_LIMIT_THRESHOLD ? (_jsxs("p", { className: "text-xs mt-2", style: { color: 'var(--text-muted)' }, children: [PROFILE_TASK_LIMIT_THRESHOLD - completion, "% to go until the task limit lifts."] })) : (_jsxs("p", { className: "text-xs mt-2 flex items-center gap-1 text-green-600 dark:text-green-400", children: [_jsx(CheckCircle2, { size: 14 }), " Task limit lifted \u2014 full task access unlocked."] }))] }), _jsxs("form", { onSubmit: handleSave, className: "space-y-5 card", "data-aos": "fade-up", "data-aos-delay": "80", children: [saved && _jsx("div", { className: "alert alert-success text-sm", children: "Profile updated." }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Phone number" }), _jsx("input", { className: "input-field", placeholder: "+254 7xx xxx xxx", value: form.phone, onChange: (e) => setForm({ ...form, phone: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Country" }), _jsx("input", { className: "input-field", placeholder: "Kenya", value: form.country, onChange: (e) => setForm({ ...form, country: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Short bio" }), _jsx("textarea", { className: "input-field min-h-24", placeholder: "Tell task reviewers a bit about yourself (20+ characters)\u2026", value: form.bio, onChange: (e) => setForm({ ...form, bio: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold mb-2", children: "Skills" }), _jsx("div", { className: "flex flex-wrap gap-2", children: SKILL_OPTIONS.map((skill) => (_jsx("button", { type: "button", onClick: () => toggleSkill(skill), className: `text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${form.skills.includes(skill) ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}`, children: skill }, skill))) })] }), _jsxs("label", { className: "flex items-center gap-3 text-sm cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: form.payoutMethodAdded, onChange: (e) => setForm({ ...form, payoutMethodAdded: e.target.checked }), className: "w-4 h-4" }), "I've added a payout method (needed before your first withdrawal)"] }), _jsx("button", { type: "submit", className: "btn-primary w-full py-3", children: "Save profile" })] })] }) }));
}
//# sourceMappingURL=ProfileCompletion.js.map