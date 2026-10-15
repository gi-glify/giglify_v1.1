import { useEffect, useState } from "react";
import { ArrowRight, BadgePercent, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LAUNCH_OFFERS, LAUNCH_OFFER_DISABLED_KEY, LAUNCH_OFFER_DISMISSAL_KEY, shouldShowLaunchOfferModal } from "../../lib/launchOffers";

function canShowOffer(): boolean {
  try { return shouldShowLaunchOfferModal(window.localStorage.getItem(LAUNCH_OFFER_DISMISSAL_KEY), Date.now(), window.localStorage.getItem(LAUNCH_OFFER_DISABLED_KEY) === "true"); }
  catch { return true; }
}

export default function LaunchOfferModal() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setOpen(canShowOffer()), 850);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
  }, [open]);

  function close() {
    try { window.localStorage.setItem(LAUNCH_OFFER_DISMISSAL_KEY, String(Date.now())); } catch { /* Continue when storage is unavailable. */ }
    setOpen(false);
  }

  function disable() {
    try { window.localStorage.setItem(LAUNCH_OFFER_DISABLED_KEY, "true"); } catch { /* Continue when storage is unavailable. */ }
    setOpen(false);
  }

  if (!open) return null;

  return <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <section className="launch-offer-modal w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="launch-offer-title" aria-describedby="launch-offer-description">
      <div className="relative overflow-hidden bg-navy-900 px-6 pb-7 pt-6 text-white sm:px-8 sm:pt-8">
        <div className="launch-offer-glow" aria-hidden="true" />
        <button type="button" onClick={close} className="absolute right-4 top-4 rounded-full p-2 text-white/75 transition hover:bg-white/10 hover:text-white" aria-label="Close launch offer reminder"><X size={20} /></button>
        <div className="relative flex items-start gap-3 pr-8"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-amber text-navy-900"><BadgePercent size={23} /></div><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary-amber">Giglify launch offer</p><h2 id="launch-offer-title" className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl">Unlock more tasks for less.</h2></div></div>
        <p id="launch-offer-description" className="relative mt-5 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base">Choose a package at its limited one-time launch price. Regular prices are shown clearly so you can see exactly how much you save.</p>
      </div>
      <div className="bg-[var(--bg-elevated)] p-5 sm:p-7">
        <div className="grid gap-3 sm:grid-cols-3">{LAUNCH_OFFERS.map((offer, index) => <article key={offer.tier} className={`launch-offer-card rounded-2xl border p-4 ${index === 1 ? "launch-offer-card-featured" : ""}`}><div className="flex items-center justify-between gap-2"><h3 className="font-display text-lg">{offer.tier}</h3>{index === 1 && <span className="rounded-full bg-primary-amber px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-900">Popular</span>}</div><div className="mt-4 flex items-end gap-2"><strong className="font-display text-3xl text-brand-700 dark:text-brand-300">${offer.offerPriceUsd}</strong><span className="pb-1 text-sm text-[var(--text-muted)] line-through">${offer.regularPriceUsd}</span></div><p className="mt-1 text-xs font-semibold text-accent-green">Save ${offer.savingsUsd}</p><p className="mt-3 text-xs leading-relaxed text-[var(--text-muted)]">{offer.detail}</p><p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">1 month access</p></article>)}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><button type="button" onClick={close} className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]">Remind me in 2 hours</button><button type="button" onClick={disable} className="text-xs font-semibold text-[var(--text-muted)] underline decoration-dotted underline-offset-4 hover:text-[var(--text)]">Don’t show again</button></div><button type="button" onClick={() => { close(); navigate("/deposit#packages"); }} className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold">Explore packages <ArrowRight size={17} /></button></div>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--text-muted)]">Offer availability is limited. Package access starts after verified payment.</p>
      </div>
    </section>
  </div>;
}
