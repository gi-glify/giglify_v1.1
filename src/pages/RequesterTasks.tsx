import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/authStore";

const CATEGORIES = ["academic", "ai-training", "coding", "data-labeling", "design", "research", "translation", "writing"];

export default function RequesterTasksPage() {
  const user = useAuthStore((state) => state.user);
  const [eligible, setEligible] = useState(false);
  const [drafts, setDrafts] = useState<Array<{ id: string; title: string; status: string; created_at: string }>>([]);
  const [form, setForm] = useState({ title: "", context: "", category: "academic", difficulty: "medium", reward: "5", questions: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!user) return;
    const [{ data: application }, { data: existing }] = await Promise.all([
      supabase.from("requester_applications").select("status").eq("user_id", user.id).maybeSingle(),
      supabase.from("requester_task_drafts").select("id, title, status, created_at").eq("requester_id", user.id).order("created_at", { ascending: false }),
    ]);
    setEligible(["review-ready", "approved"].includes(application?.status || "")); setDrafts(existing || []);
  }

  useEffect(() => { load(); }, [user?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    const questions = form.questions.split("\n").map((question) => question.trim()).filter(Boolean).map((question, index) => ({ question_number: index + 1, question_text: question }));
    const { error: insertError } = await supabase.from("requester_task_drafts").insert({ requester_id: user?.id, title: form.title.trim(), context: form.context.trim(), category: form.category, difficulty: form.difficulty, reward: Number(form.reward), questions, status: "pending_review" });
    if (insertError) setError(insertError.message); else { setForm({ ...form, title: "", context: "", questions: "" }); await load(); }
    setSaving(false);
  }

  if (!eligible) return <main className="container max-w-2xl py-10"><section className="card text-center" data-aos="zoom-in"><h1 className="font-display text-2xl">Your requester profile is almost ready</h1><p className="text-sm mt-3" style={{ color: "var(--text-muted)" }}>Complete your verification, then publish tasks that give vetted Giglify workers a clear way to contribute to your project.</p><Link to="/requester/apply" className="btn-primary inline-flex mt-5">Start requester setup</Link></section></main>;
  return <main className="container max-w-3xl py-8"><h1 className="font-display text-2xl mb-2" data-aos="fade-down">Create a task your project can use</h1><p className="text-sm mb-6" style={{ color: "var(--text-muted)" }} data-aos="fade-up">Describe the result you need, set the reward, and let our vetted worker community help move your work forward. Every task is reviewed before it goes live.</p><form className="card space-y-4" data-aos="fade-up" onSubmit={submit}><label className="text-sm font-semibold block">Task title<input className="input-field w-full mt-2" required minLength={5} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label className="text-sm font-semibold block">Context and instructions<textarea className="input-field w-full mt-2 min-h-32" required minLength={20} value={form.context} onChange={(e) => setForm({ ...form, context: e.target.value })} /></label><div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-semibold">Category<select className="input-field w-full mt-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label><label className="text-sm font-semibold">Difficulty<select className="input-field w-full mt-2" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}><option>easy</option><option>medium</option><option>hard</option><option>expert</option></select></label><label className="text-sm font-semibold">Reward USD<input className="input-field w-full mt-2" type="number" min="0.01" step="0.01" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} /></label></div><label className="text-sm font-semibold block">Questions, one per line<textarea className="input-field w-full mt-2 min-h-32" required value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} /></label>{error && <p className="alert alert-error text-sm">{error}</p>}<button className="btn-primary" disabled={saving}>{saving ? "Submitting for review..." : "Submit task for review"}</button></form><section className="mt-8 space-y-3" data-aos="fade-up"><h2 className="font-display text-xl">Your task submissions</h2>{drafts.length === 0 ? <p className="text-sm" style={{ color: "var(--text-muted)" }}>No task drafts yet.</p> : drafts.map((draft) => <div className="card flex items-center justify-between gap-4" key={draft.id}><div><p className="font-semibold">{draft.title}</p><p className="text-xs capitalize" style={{ color: "var(--text-muted)" }}>{draft.status.replace("_", " ")}</p></div><span className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(draft.created_at).toLocaleDateString()}</span></div>)}</section></main>;
}
