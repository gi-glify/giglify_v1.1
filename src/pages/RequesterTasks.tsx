import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Clock3, FilePenLine, Save, Send, Trash2 } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/authStore";
import AOS from "aos";
import "aos/dist/aos.css";

const CATEGORIES = ["academic", "ai-training", "coding", "data-labeling", "design", "research", "translation", "writing"];
const DIFFICULTIES = ["easy", "medium", "hard", "expert"];
const EMPTY_FORM = { title: "", context: "", category: "academic", difficulty: "medium", reward: "5", questions: "" };

type DraftStatus = "draft" | "pending_review" | "approved" | "rejected";
type TaskDraft = {
  id: string;
  title: string;
  context: string;
  category: string;
  difficulty: string;
  reward: number;
  questions: Array<{ question_text?: string }>;
  status: DraftStatus;
  created_at: string;
  reviewed_at: string | null;
  admin_note: string | null;
  published_task_code: string | null;
};

function statusLabel(status: DraftStatus) {
  return status === "pending_review" ? "Pending review" : status.charAt(0).toUpperCase() + status.slice(1);
}

function statusClass(status: DraftStatus) {
  if (status === "approved") return "badge-green";
  if (status === "rejected") return "badge-red";
  if (status === "pending_review") return "badge-yellow";
  return "badge-blue";
}

export default function RequesterTasksPage() {
  const user = useAuthStore((state) => state.user);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<TaskDraft[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
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
    if (applicationError || draftsError) throw applicationError || draftsError;
    setEligible(["review-ready", "approved"].includes(application?.status || ""));
    setDrafts((existing || []) as TaskDraft[]);
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

  const counts = useMemo(() => drafts.reduce<Record<string, number>>((total, draft) => {
    total[draft.status] = (total[draft.status] || 0) + 1;
    return total;
  }, {}), [drafts]);

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingDraftId(null);
  }

  function editDraft(draft: TaskDraft) {
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

  async function submit(event: FormEvent | MouseEvent<HTMLButtonElement>, nextStatus: "draft" | "pending_review") {
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
      } else {
        resetForm();
        setMessage(nextStatus === "draft" ? "Draft saved. You can return and submit it when ready." : "Task submitted for review. You can track its status below.");
        await load();
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save this task.");
    } finally {
      setSaving(false);
    }
  }

  async function removeDraft(draft: TaskDraft) {
    if (!user || !window.confirm(`Delete the ${draft.status === "rejected" ? "rejected task" : "draft"} “${draft.title}”?`)) return;
    setError("");
    const { error: deleteError } = await supabase.from("requester_task_drafts").delete().eq("id", draft.id).eq("requester_id", user.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  if (!user) return <main className="container max-w-2xl py-10"><section className="card text-center" data-aos="zoom-in"><h1 className="font-display text-2xl">Sign in to post a task</h1><p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>Create an account or sign in to set up your requester profile and post work for Giglify workers.</p><Link to="/auth" className="btn-primary inline-flex mt-5 items-center gap-2">Sign in <ArrowRight size={16} /></Link></section></main>;
  if (loading) return <main className="container max-w-3xl py-10"><div className="card text-sm" style={{ color: "var(--text-muted)" }}>Loading your requester workspace…</div></main>;
  if (!eligible) return <main className="container max-w-2xl py-10"><section className="card text-center" data-aos="zoom-in"><h1 className="font-display text-2xl">Your requester profile is almost ready</h1><p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>Complete verification first, then create tasks for our vetted worker community.</p><Link to="/requester/apply" className="btn-primary inline-flex mt-5 items-center gap-2">Start requester setup <ArrowRight size={16} /></Link></section></main>;

  return <main className="container max-w-4xl py-8">
    <section className="mb-6" data-aos="fade-down"><p className="text-xs font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Requester workspace</p><h1 className="font-display text-2xl mt-1">Create and manage tasks</h1><p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Save a draft while you prepare the brief, then submit it for review when the instructions and questions are ready.</p></section>
    <section className="grid gap-3 sm:grid-cols-4 mb-6" aria-label="Task status summary">{[["draft", "Drafts"], ["pending_review", "In review"], ["approved", "Published"], ["rejected", "Needs changes"]].map(([status, label]) => <div className="card" key={status}><p className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</p><p className="font-display text-2xl font-bold mt-1">{counts[status] || 0}</p></div>)}</section>
    <form className="card space-y-4" data-aos="fade-up" onSubmit={(event) => void submit(event, "pending_review")}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="font-display text-xl">{editingDraftId ? "Edit task" : "New task"}</h2><p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>One question per line. Add enough context for a worker to complete the task without guessing.</p></div>{editingDraftId && <button type="button" className="btn-secondary text-xs" onClick={resetForm}>Cancel edit</button>}</div>
      <label className="text-sm font-semibold block">Task title<input className="input-field w-full mt-2" required minLength={5} maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
      <label className="text-sm font-semibold block">Context and instructions<textarea className="input-field w-full mt-2 min-h-32" required minLength={20} maxLength={5000} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} /></label>
      <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">Category<select className="input-field w-full mt-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-sm font-semibold">Difficulty<select className="input-field w-full mt-2" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>{DIFFICULTIES.map((difficulty) => <option key={difficulty}>{difficulty}</option>)}</select></label><label className="text-sm font-semibold">Reward USD<input className="input-field w-full mt-2" type="number" min="0.01" step="0.01" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} /></label></div>
      <label className="text-sm font-semibold block">Questions, one per line<textarea className="input-field w-full mt-2 min-h-32" required value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} placeholder={"What should the worker inspect?\nWhat result should they return?"} /></label>
      {error && <p className="alert alert-error text-sm">{error}</p>}{message && <p className="alert alert-info text-sm">{message}</p>}
      <div className="flex flex-wrap gap-3"><button type="button" className="btn-secondary inline-flex items-center gap-2" disabled={saving} onClick={(event) => void submit(event, "draft")}><Save size={16} /> Save draft</button><button className="btn-primary inline-flex items-center gap-2" disabled={saving}>{saving ? "Saving…" : <><Send size={16} /> Submit for review</>}</button></div>
    </form>
    <section className="mt-8 space-y-3" data-aos="fade-up"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl">Your tasks</h2><Link to="/requester/apply" className="text-sm font-semibold text-brand-600 dark:text-brand-300">View requester profile <ArrowRight size={14} className="inline" /></Link></div>{drafts.length === 0 ? <div className="card text-sm" style={{ color: "var(--text-muted)" }}>No tasks yet. Start with a draft above.</div> : drafts.map((draft) => <article className="card" key={draft.id}><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><h3 className="font-semibold">{draft.title}</h3><span className={`badge ${statusClass(draft.status)}`}>{statusLabel(draft.status)}</span></div><p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>{draft.category.replace("-", " ")} · {draft.difficulty} · ${Number(draft.reward).toFixed(2)} · {draft.questions.length} question{draft.questions.length === 1 ? "" : "s"}</p><p className="text-xs mt-1 inline-flex items-center gap-1" style={{ color: "var(--text-muted)" }}><Clock3 size={12} /> Created {new Date(draft.created_at).toLocaleDateString()}</p></div><div className="flex items-center gap-2">{["draft", "rejected"].includes(draft.status) && <button type="button" className="btn-secondary text-xs inline-flex items-center gap-1" onClick={() => editDraft(draft)}><FilePenLine size={14} /> Edit</button>}{["draft", "rejected"].includes(draft.status) && <button type="button" className="text-xs text-red-600 dark:text-red-300 inline-flex items-center gap-1" onClick={() => void removeDraft(draft)}><Trash2 size={14} /> Delete</button>}</div></div>{draft.admin_note && <p className="alert alert-info mt-4 text-sm">Reviewer note: {draft.admin_note}</p>}{draft.status === "approved" && draft.published_task_code && <Link to={`/tasks/${encodeURIComponent(draft.published_task_code)}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-300">View published worker task <ArrowRight size={14} /></Link>}{draft.status === "approved" && !draft.published_task_code && <p className="mt-4 text-xs text-green-700 dark:text-green-300 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Published and available to workers</p>}</article>)}</section>
  </main>;
}
