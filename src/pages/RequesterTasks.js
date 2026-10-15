import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, FileText, Save, Send, Trash2 } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/authStore";
import AOS from "aos";
import "aos/dist/aos.css";
const CATEGORIES = ["academic", "ai-training", "coding", "data-labeling", "design", "research", "translation", "writing"];
const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const EMPTY_FORM = { title: "", context: "", category: "academic", difficulty: "medium", reward: "5", questions: "" };
function statusLabel(status) {
    return status === "pending_review" ? "Pending review" : status.charAt(0).toUpperCase() + status.slice(1);
}
function statusClass(status) {
    if (status === "approved")
        return "badge-green";
    if (status === "rejected")
        return "badge-red";
    if (status === "pending_review")
        return "badge-yellow";
    return "badge-blue";
}
export default function RequesterTasksPage() {
    const user = useAuthStore((state) => state.user);
    const [eligible, setEligible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [drafts, setDrafts] = useState([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingDraftId, setEditingDraftId] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [saving, setSaving] = useState(false);
    async function load() {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const [{ data: application, error: applicationError }, { data: existing, error: draftsError }] = await Promise.all([
            supabase.from("requester_applications").select("status").eq("user_id", user.id).maybeSingle(),
            supabase.from("requester_task_drafts").select("id, title, context, category, difficulty, reward, questions, status, created_at, reviewed_at, admin_note, published_task_code").eq("requester_id", user.id).order("created_at", { ascending: false }),
        ]);
        if (applicationError || draftsError)
            throw applicationError || draftsError;
        setEligible(["review-ready", "approved"].includes(application?.status || ""));
        setDrafts((existing || []));
        setLoading(false);
    }
    useEffect(() => {
        const refreshTimer = window.setTimeout(() => AOS.refreshHard(), 0);
        return () => window.clearTimeout(refreshTimer);
    }, []);
    useEffect(() => {
        void load().catch((loadError) => {
            setError(loadError instanceof Error ? loadError.message : "Unable to load your requester tasks.");
            setLoading(false);
        });
    }, [user?.id]);
    const counts = useMemo(() => drafts.reduce((total, draft) => {
        total[draft.status] = (total[draft.status] || 0) + 1;
        return total;
    }, {}), [drafts]);
    function resetForm() {
        setForm(EMPTY_FORM);
        setEditingDraftId(null);
    }
    function editDraft(draft) {
        setEditingDraftId(draft.id);
        setForm({
            title: draft.title,
            context: draft.context,
            category: draft.category,
            difficulty: draft.difficulty,
            reward: String(draft.reward),
            questions: draft.questions.map((question) => question.question_text || "").join("\n"),
        });
        setError("");
        setMessage("Update the task below, then save it or send it back for review.");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    async function submit(event, nextStatus) {
        event.preventDefault();
        if (!user) {
            setError("Sign in before creating a requester task.");
            return;
        }
        const questions = form.questions.split("\n").map((question) => question.trim()).filter(Boolean).map((question, index) => ({ question_number: index + 1, question_text: question }));
        if (form.title.trim().length < 5 || form.context.trim().length < 20) {
            setError("Add a task title of at least 5 characters and instructions of at least 20 characters.");
            return;
        }
        if (questions.length === 0 || questions.length > 10 || questions.some((question) => question.question_text.length < 5)) {
            setError("Add between 1 and 10 questions, with at least 5 characters per question.");
            return;
        }
        const reward = Number(form.reward);
        if (!Number.isFinite(reward) || reward <= 0) {
            setError("Enter a reward greater than zero.");
            return;
        }
        setSaving(true);
        setError("");
        setMessage("");
        const payload = { requester_id: user.id, title: form.title.trim(), context: form.context.trim(), category: form.category, difficulty: form.difficulty, reward, questions, status: nextStatus };
        try {
            const result = editingDraftId
                ? await supabase.from("requester_task_drafts").update(payload).eq("id", editingDraftId).eq("requester_id", user.id)
                : await supabase.from("requester_task_drafts").insert(payload);
            if (result.error) {
                setError(result.error.message);
            }
            else {
                resetForm();
                setMessage(nextStatus === "draft" ? "Draft saved. You can return and submit it when ready." : "Task submitted for review. You can track its status below.");
                await load();
            }
        }
        catch (submissionError) {
            setError(submissionError instanceof Error ? submissionError.message : "Unable to save this task.");
        }
        finally {
            setSaving(false);
        }
    }
    async function removeDraft(draft) {
        if (!user || !window.confirm(`Delete the ${draft.status === "rejected" ? "rejected task" : "draft"} “${draft.title}”?`))
            return;
        setError("");
        const { error: deleteError } = await supabase.from("requester_task_drafts").delete().eq("id", draft.id).eq("requester_id", user.id);
        if (deleteError)
            setError(deleteError.message);
        else
            await load();
    }
    if (!user)
        return _jsx("main", { className: "container max-w-2xl py-10", children: _jsxs("section", { className: "card text-center", "data-aos": "zoom-in", children: [_jsx("h1", { className: "font-display text-2xl", children: "Sign in to post a task" }), _jsx("p", { className: "text-sm mt-3", style: { color: "var(--text-muted)" }, children: "Create an account or sign in to set up your requester profile and post work for Giglify workers." }), _jsxs(Link, { to: "/auth", className: "btn-primary inline-flex mt-5 items-center gap-2", children: ["Sign in ", _jsx(ArrowRight, { size: 16 })] })] }) });
    if (loading)
        return _jsx("main", { className: "container max-w-3xl py-10", children: _jsx("div", { className: "card text-sm", style: { color: "var(--text-muted)" }, children: "Loading your requester workspace\u2026" }) });
    if (!eligible)
        return _jsx("main", { className: "container max-w-2xl py-10", children: _jsxs("section", { className: "card text-center", "data-aos": "zoom-in", children: [_jsx("h1", { className: "font-display text-2xl", children: "Your requester profile is almost ready" }), _jsx("p", { className: "text-sm mt-3", style: { color: "var(--text-muted)" }, children: "Complete verification first, then create tasks for our vetted worker community." }), _jsxs(Link, { to: "/requester/apply", className: "btn-primary inline-flex mt-5 items-center gap-2", children: ["Start requester setup ", _jsx(ArrowRight, { size: 16 })] })] }) });
    return _jsxs("main", { className: "container max-w-4xl py-8", children: [_jsxs("section", { className: "mb-6", "data-aos": "fade-down", children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300", children: "Requester workspace" }), _jsx("h1", { className: "font-display text-2xl mt-1", children: "Create and manage tasks" }), _jsx("p", { className: "text-sm mt-2", style: { color: "var(--text-muted)" }, children: "Save a draft while you prepare the brief, then submit it for review when the instructions and questions are ready." })] }), _jsx("section", { className: "grid gap-3 sm:grid-cols-4 mb-6", "aria-label": "Task status summary", children: [["draft", "Drafts"], ["pending_review", "In review"], ["approved", "Published"], ["rejected", "Needs changes"]].map(([status, label]) => _jsxs("div", { className: "card", children: [_jsx("p", { className: "text-xs", style: { color: "var(--text-muted)" }, children: label }), _jsx("p", { className: "font-display text-2xl font-bold mt-1", children: counts[status] || 0 })] }, status)) }), _jsxs("form", { className: "card space-y-4", "data-aos": "fade-up", onSubmit: (event) => void submit(event, "pending_review"), children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-display text-xl", children: editingDraftId ? "Edit task" : "New task" }), _jsx("p", { className: "text-xs mt-1", style: { color: "var(--text-muted)" }, children: "One question per line. Add enough context for a worker to complete the task without guessing." })] }), editingDraftId && _jsx("button", { type: "button", className: "btn-secondary text-xs", onClick: resetForm, children: "Cancel edit" })] }), _jsxs("label", { className: "text-sm font-semibold block", children: ["Task title", _jsx("input", { className: "input-field w-full mt-2", required: true, minLength: 5, maxLength: 160, value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }) })] }), _jsxs("label", { className: "text-sm font-semibold block", children: ["Context and instructions", _jsx("textarea", { className: "input-field w-full mt-2 min-h-32", required: true, minLength: 20, maxLength: 5000, value: form.context, onChange: (e) => setForm({ ...form, context: e.target.value }) })] }), _jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [_jsxs("label", { className: "text-sm font-semibold", children: ["Category", _jsx("select", { className: "input-field w-full mt-2", value: form.category, onChange: (e) => setForm({ ...form, category: e.target.value }), children: CATEGORIES.map((category) => _jsx("option", { children: category }, category)) })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Difficulty", _jsx("select", { className: "input-field w-full mt-2", value: form.difficulty, onChange: (e) => setForm({ ...form, difficulty: e.target.value }), children: DIFFICULTIES.map((difficulty) => _jsx("option", { children: difficulty }, difficulty)) })] }), _jsxs("label", { className: "text-sm font-semibold", children: ["Reward USD", _jsx("input", { className: "input-field w-full mt-2", type: "number", min: "0.01", step: "0.01", value: form.reward, onChange: (e) => setForm({ ...form, reward: e.target.value }) })] })] }), _jsxs("label", { className: "text-sm font-semibold block", children: ["Questions, one per line", _jsx("textarea", { className: "input-field w-full mt-2 min-h-32", required: true, value: form.questions, onChange: (e) => setForm({ ...form, questions: e.target.value }), placeholder: "What should the worker inspect?\nWhat result should they return?" })] }), error && _jsx("p", { className: "alert alert-error text-sm", children: error }), message && _jsx("p", { className: "alert alert-info text-sm", children: message }), _jsxs("div", { className: "flex flex-wrap gap-3", children: [_jsxs("button", { type: "button", className: "btn-secondary inline-flex items-center gap-2", disabled: saving, onClick: (event) => void submit(event, "draft"), children: [_jsx(Save, { size: 16 }), " Save draft"] }), _jsx("button", { className: "btn-primary inline-flex items-center gap-2", disabled: saving, children: saving ? "Saving…" : _jsxs(_Fragment, { children: [_jsx(Send, { size: 16 }), " Submit for review"] }) })] })] }), _jsxs("section", { className: "mt-8 space-y-3", "data-aos": "fade-up", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsx("h2", { className: "font-display text-xl", children: "Your tasks" }), _jsxs(Link, { to: "/requester/apply", className: "text-sm font-semibold text-brand-600 dark:text-brand-300", children: ["View requester profile ", _jsx(ArrowRight, { size: 14, className: "inline" })] })] }), drafts.length === 0 ? _jsx("div", { className: "card text-sm", style: { color: "var(--text-muted)" }, children: "No tasks yet. Start with a draft above." }) : drafts.map((draft) => _jsxs("article", { className: "card", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { className: "min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [_jsx("h3", { className: "font-semibold", children: draft.title }), _jsx("span", { className: `badge ${statusClass(draft.status)}`, children: statusLabel(draft.status) })] }), _jsxs("p", { className: "text-xs mt-2", style: { color: "var(--text-muted)" }, children: [draft.category.replace("-", " "), " \u00B7 ", draft.difficulty, " \u00B7 $", Number(draft.reward).toFixed(2), " \u00B7 ", draft.questions.length, " question", draft.questions.length === 1 ? "" : "s"] }), _jsxs("p", { className: "text-xs mt-1 inline-flex items-center gap-1", style: { color: "var(--text-muted)" }, children: [_jsx(Clock3, { size: 12 }), " Created ", new Date(draft.created_at).toLocaleDateString()] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [["draft", "rejected"].includes(draft.status) && _jsxs("button", { type: "button", className: "btn-secondary text-xs inline-flex items-center gap-1", onClick: () => editDraft(draft), children: [_jsx(FileText, { size: 14 }), " Edit"] }), ["draft", "rejected"].includes(draft.status) && _jsxs("button", { type: "button", className: "text-xs text-red-600 dark:text-red-300 inline-flex items-center gap-1", onClick: () => void removeDraft(draft), children: [_jsx(Trash2, { size: 14 }), " Delete"] })] })] }), draft.admin_note && _jsxs("p", { className: "alert alert-info mt-4 text-sm", children: ["Reviewer note: ", draft.admin_note] }), draft.status === "approved" && draft.published_task_code && _jsxs(Link, { to: `/tasks/${encodeURIComponent(draft.published_task_code)}`, className: "mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300", children: ["View published worker task ", _jsx(ArrowRight, { size: 14 })] }), draft.status === "approved" && !draft.published_task_code && _jsxs("p", { className: "mt-4 text-xs text-green-700 dark:text-green-300 inline-flex items-center gap-1", children: [_jsx(CheckCircle2, { size: 14 }), " Published and available to workers"] })] }, draft.id))] })] });
}
//# sourceMappingURL=RequesterTasks.js.map