import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/authStore";
const CATEGORIES = ["academic", "ai-training", "coding", "data-labeling", "design", "research", "translation", "writing"];
export default function RequesterTasksPage() {
    const user = useAuthStore((state) => state.user);
    const [eligible, setEligible] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [form, setForm] = useState({ title: "", context: "", category: "academic", difficulty: "medium", reward: "5", questions: "" });
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    async function load() {
        if (!user)
            return;
        const [{ data: application }, { data: existing }] = await Promise.all([
            supabase.from("requester_applications").select("status").eq("user_id", user.id).maybeSingle(),
            supabase.from("requester_task_drafts").select("id, title, status, created_at").eq("requester_id", user.id).order("created_at", { ascending: false }),
        ]);
        setEligible(["review-ready", "approved"].includes(application?.status || ""));
        setDrafts(existing || []);
    }
    useEffect(() => { load(); }, [user?.id]);
    async function submit(event) {
        event.preventDefault();
        setSaving(true);
        setError("");
        const questions = form.questions.split("\n").map((question) => question.trim()).filter(Boolean).map((question, index) => ({ question_number: index + 1, question_text: question }));
        const { error: insertError } = await supabase.from("requester_task_drafts").insert({ requester_id: user?.id, title: form.title.trim(), context: form.context.trim(), category: form.category, difficulty: form.difficulty, reward: Number(form.reward), questions, status: "pending_review" });
        if (insertError)
            setError(insertError.message);
        else {
            setForm({ ...form, title: "", context: "", questions: "" });
            await load();
        }
        setSaving(false);
    }
    if (!eligible)
        return _jsx("main", { className: "container max-w-2xl py-10", children: _jsxs("section", { className: "card text-center", "data-aos": "zoom-in", children: [_jsx("h1", { className: "font-display text-2xl", children: "Requester access is pending" }), _jsx("p", { className: "text-sm mt-3", style: { color: "var(--text-muted)" }, children: "Complete the KYC application and wait for the 72-hour review notification before posting tasks." }), _jsx(Link, { to: "/requester/apply", className: "btn-primary inline-flex mt-5", children: "View application" })] }) });
    return _jsxs("main", { className: "container max-w-3xl py-8", children: [_jsx("h1", { className: "font-display text-2xl mb-2", "data-aos": "fade-down", children: "Post a task" }), _jsx("p", { className: "text-sm mb-6", style: { color: "var(--text-muted)" }, "data-aos": "fade-up", children: "Your draft will be reviewed before workers can access it. Requester payouts remain pending until the task is verified." }), _jsxs("form", { className: "card space-y-4", "data-aos": "fade-up", onSubmit: submit, children: [_jsxs("label", { className: "text-sm font-semibold block", children: ["Task title", _jsx("input", { className: "input-field w-full mt-2", required: true, minLength: 5, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) })] }), _jsxs("label", { className: "text-sm font-semibold block", children: ["Context and instructions", _jsx("textarea", { className: "input-field w-full mt-2 min-h-32", required: true, minLength: 20, value: form.context, onChange: (e) => setForm({ ...form, context: e.target.value }) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("label", { className: "text-sm font-semibold", children: ["Category", _jsx("select", { className: "input-field w-full mt-2", value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), children: CATEGORIES.map((category) => _jsx("option", { children: category }, category)) })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Difficulty", _jsxs("select", { className: "input-field w-full mt-2", value: form.difficulty, onChange: (e) => setForm({ ...form, difficulty: e.target.value }), children: [_jsx("option", { children: "easy" }), _jsx("option", { children: "medium" }), _jsx("option", { children: "hard" }), _jsx("option", { children: "expert" })] })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Reward USD", _jsx("input", { className: "input-field w-full mt-2", type: "number", min: "0.01", step: "0.01", value: form.reward, onChange: (e) => setForm({ ...form, reward: e.target.value }) })] })] }), _jsxs("label", { className: "text-sm font-semibold block", children: ["Questions, one per line", _jsx("textarea", { className: "input-field w-full mt-2 min-h-32", required: true, value: form.questions, onChange: (e) => setForm({ ...form, questions: e.target.value }) })] }), error && _jsx("p", { className: "alert alert-error text-sm", children: error }), _jsx("button", { className: "btn-primary", disabled: saving, children: saving ? "Submitting for review..." : "Submit task for review" })] }), _jsxs("section", { className: "mt-8 space-y-3", "data-aos": "fade-up", children: [_jsx("h2", { className: "font-display text-xl", children: "Your task submissions" }), drafts.length === 0 ? _jsx("p", { className: "text-sm", style: { color: "var(--text-muted)" }, children: "No task drafts yet." }) : drafts.map((draft) => _jsxs("div", { className: "card flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold", children: draft.title }), _jsx("p", { className: "text-xs capitalize", style: { color: "var(--text-muted)" }, children: draft.status.replace("_", " ") })] }), _jsx("span", { className: "text-xs", style: { color: "var(--text-muted)" }, children: new Date(draft.created_at).toLocaleDateString() })] }, draft.id))] })] });
}
//# sourceMappingURL=RequesterTasks.js.map