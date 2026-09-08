import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileCheck2, ShieldCheck } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/authStore";

type Application = { status: string; review_available_at: string; admin_note: string | null };

export default function RequesterKycPage() {
  const user = useAuthStore((state) => state.user);
  const [application, setApplication] = useState<Application | null>(null);
  const [form, setForm] = useState({ legalName: "", organization: "", phone: "", country: "Kenya", idType: "national_id", idNumber: "", taskBrief: "" });
  const [document, setDocument] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("requester_applications").select("status, review_available_at, admin_note").eq("user_id", user.id).maybeSingle().then(({ data }) => setApplication(data));
  }, [user?.id]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !document) { setError("Upload your identity document before submitting."); return; }
    setState("loading"); setError("");
    try {
      const safeName = document.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
      const upload = await supabase.storage.from("requester-kyc").upload(path, document, { upsert: false });
      if (upload.error) throw upload.error;
      const { data, error: insertError } = await supabase.from("requester_applications").upsert({
        user_id: user.id, legal_name: form.legalName.trim(), organization_name: form.organization.trim() || null,
        phone: form.phone.trim(), country: form.country.trim(), id_type: form.idType, id_number: form.idNumber.trim(),
        id_document_path: upload.data.path, task_brief: form.taskBrief.trim(), status: "pending",
      }, { onConflict: "user_id" }).select("status, review_available_at, admin_note").single();
      if (insertError) throw insertError;
      setApplication(data); setState("sent");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to submit your application."); setState("error");
    }
  }

  return <main className="container max-w-3xl py-8" style={{ color: "var(--text)" }}>
    <section className="card mb-6" data-aos="fade-down">
      <div className="flex items-start gap-3"><ShieldCheck className="text-brand-600 dark:text-brand-300 shrink-0" /><div><h1 className="font-display text-2xl">Become a task requester</h1><p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Submit your identity and task requirements for a rigorous review. We will notify you when the 72-hour review window is complete.</p></div></div>
    </section>
    {application ? <section className="card" data-aos="fade-up"><p className="text-sm font-semibold">Application status: <span className="capitalize">{application.status.replace("-", " ")}</span></p><p className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>Review notification available from {new Date(application.review_available_at).toLocaleString()}.</p>{application.admin_note && <p className="alert alert-info mt-4 text-sm">{application.admin_note}</p>}{["review-ready", "approved"].includes(application.status) && <Link to="/requester/tasks" className="btn-primary inline-flex mt-5">Post a task</Link>}</section> : <form className="card space-y-4" data-aos="fade-up" onSubmit={submit}><h2 className="font-display text-xl">KYC application</h2><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Legal name<input className="input-field w-full mt-2" required value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} /></label><label className="text-sm font-semibold">Organization (optional)<input className="input-field w-full mt-2" value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} /></label><label className="text-sm font-semibold">Phone<input className="input-field w-full mt-2" required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label className="text-sm font-semibold">Country<input className="input-field w-full mt-2" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></label><label className="text-sm font-semibold">ID type<select className="input-field w-full mt-2" value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}><option value="national_id">National ID</option><option value="passport">Passport</option><option value="business_registration">Business registration</option></select></label><label className="text-sm font-semibold">ID number<input className="input-field w-full mt-2" required inputMode="numeric" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} /></label></div><label className="text-sm font-semibold block">Identity document<input className="input-field w-full mt-2" type="file" accept="image/*,.pdf" required onChange={(e) => setDocument(e.target.files?.[0] || null)} /></label><label className="text-sm font-semibold block">What do you want to post?<textarea className="input-field w-full mt-2 min-h-32" required minLength={20} value={form.taskBrief} onChange={(e) => setForm({ ...form, taskBrief: e.target.value })} placeholder="Describe the work, audience, expected answer, and quality standard." /></label>{error && <p className="alert alert-error text-sm">{error}</p>}{state === "sent" && <p className="alert alert-success text-sm">Application submitted. You will receive a notification after the review window.</p>}<button className="btn-primary" disabled={state === "loading"}>{state === "loading" ? "Submitting securely..." : "Submit KYC application"}</button><p className="text-xs" style={{ color: "var(--text-muted)" }}>Documents are stored privately for review and are not visible to workers.</p></form>}
  </main>;
}
