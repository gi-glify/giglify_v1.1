import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../utils/supabase";
import { useAuthStore } from "../store/authStore";

export const TEAM_EMAIL = import.meta.env.VITE_TEAM_EMAIL || "team@giglify.com";

export default function AboutPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState([user?.firstName, user?.lastName].filter(Boolean).join(" "));
  const [email, setEmail] = useState(user?.email || "");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    if (location.hash) {
      window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }, [location.hash]);

  async function submitContact(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    const { error } = await supabase.functions.invoke("contact-team", { body: { name, email, message } });
    setState(error ? "error" : "sent");
    if (!error) {
      setMessage("");
      navigate("/thank-you");
    }
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <main className="container max-w-4xl py-10 space-y-8">
        <section className="card" data-aos="fade-up">
          <p className="text-sm font-semibold text-brand-600 dark:text-brand-300 mb-2">About Giglify</p>
          <h1 className="font-display text-3xl mb-3">Small tasks. Clear rules. Fairer work.</h1>
          <p style={{ color: "var(--text-muted)" }}>Giglify connects people with focused microtasks, transparent task requirements, and accountable review.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article id="privacy" className="card scroll-mt-24">
            <ShieldCheck className="text-brand-600 dark:text-brand-300 mb-3" size={24} />
            <h2 className="font-display text-xl mb-2">Privacy policy</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>We use account, profile, task, payment, and support data to provide Giglify services, protect accounts, review work, process payouts, and improve reliability. We do not sell personal data. Payment credentials are handled by the relevant payment provider.</p>
          </article>
          <article id="data-policy" className="card scroll-mt-24">
            <CheckCircle2 className="text-brand-600 dark:text-brand-300 mb-3" size={24} />
            <h2 className="font-display text-xl mb-2">Data policy</h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Task answers may be retained for quality review, fraud prevention, dispute resolution, and payment records. AI grading uses task answers and rubrics only for grading. You may request access, correction, or deletion where legal and operational retention requirements allow.</p>
          </article>
        </section>

        <section className="card">
          <h2 id="terms" className="font-display text-xl mb-2 scroll-mt-24">Terms of use</h2>
          <div className="text-sm space-y-2" style={{ color: "var(--text-muted)" }}>
            <p>Use one honest account, provide accurate information, submit original work, and follow each task's instructions.</p>
            <p>Giglify may review, reject, or hold submissions and payments when work is incomplete, duplicated, abusive, fraudulent, or requires manual review.</p>
            <p>Payments are governed by the published grading thresholds, verification requirements, payout rules, and applicable provider terms.</p>
            <p>We may update these policies. A new version may require renewed consent before continued use.</p>
          </div>
        </section>

        <section id="contact" className="card max-w-2xl scroll-mt-24">
          <div className="flex items-center gap-2 mb-1"><Mail className="text-brand-600 dark:text-brand-300" size={20} /><h2 className="font-display text-xl">Contact the team</h2></div>
          <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>Email: <a className="text-brand-600 dark:text-brand-300 font-semibold" href={`mailto:${TEAM_EMAIL}`}>{TEAM_EMAIL}</a></p>
          <form onSubmit={submitContact} className="space-y-4">
            <input className="input-field w-full" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required minLength={2} maxLength={100} />
            <input className="input-field w-full" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email" required maxLength={320} />
            <textarea className="input-field w-full min-h-32" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="How can we help?" required minLength={10} maxLength={5000} />
            {state === "sent" && <p className="alert alert-success text-sm">Your message was sent to the Giglify team.</p>}
            {state === "error" && <p className="alert alert-error text-sm">We could not send your message. Please try again.</p>}
            <button className="btn-primary" disabled={state === "sending"}>{state === "sending" ? "Sending..." : "Send message"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}
