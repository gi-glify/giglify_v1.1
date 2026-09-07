import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../utils/supabase";

export const TERMS_VERSION = "2026-09-06";

export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    supabase.from("profiles").select("terms_accepted_at, terms_version").eq("id", user.id).maybeSingle().then(({ data, error: queryError }) => {
      if (cancelled) return;
      if (queryError) setError("We could not verify your terms consent. Please try again.");
      setAccepted(Boolean(data?.terms_accepted_at && data.terms_version === TERMS_VERSION));
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user || accepted === true) return <>{children}</>;
  if (accepted === null) return <div className="min-h-screen" style={{ background: "var(--bg)" }} />;
  const userId = user.id;

  async function acceptTerms() {
    setSaving(true);
    setError("");
    const { error: updateError } = await supabase.from("profiles").update({ terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION }).eq("id", userId);
    if (updateError) setError("We could not save your consent. Please try again.");
    else setAccepted(true);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section className="card max-w-lg w-full shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="consent-title">
        <h1 id="consent-title" className="font-display text-2xl mb-3">Before you continue</h1>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>By using Giglify, you agree to our Terms of Use, Privacy Policy, and Data Policy. Your consent is saved to your account with the current policy version.</p>
        <Link to="/about" target="_blank" className="text-sm text-brand-600 dark:text-brand-300 font-semibold">Read the full policies</Link>
        <label className="flex items-start gap-3 mt-5 text-sm">
          <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} className="mt-1" />
          <span>I agree to the Giglify terms and policies.</span>
        </label>
        {error && <p className="alert alert-error text-sm mt-4">{error}</p>}
        <button type="button" onClick={acceptTerms} disabled={!checked || saving} className="btn-primary w-full mt-5 disabled:opacity-50">{saving ? "Saving..." : "Agree and continue"}</button>
      </section>
    </div>
  );
}
