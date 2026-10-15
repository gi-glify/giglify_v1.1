import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { ArrowRight, BadgePercent, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LAUNCH_OFFERS, LAUNCH_OFFER_DISMISSAL_KEY, shouldShowLaunchOfferModal } from "../../lib/launchOffers";
function canShowOffer() {
    try {
        return shouldShowLaunchOfferModal(window.localStorage.getItem(LAUNCH_OFFER_DISMISSAL_KEY));
    }
    catch {
        return true;
    }
}
export default function LaunchOfferModal() {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(() => setOpen(canShowOffer()), 850);
        return () => window.clearTimeout(timer);
    }, []);
    useEffect(() => {
        if (!open)
            return;
        const handleKeyDown = (event) => { if (event.key === "Escape")
            close(); };
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);
        return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handleKeyDown); };
    }, [open]);
    function close() {
        try {
            window.localStorage.setItem(LAUNCH_OFFER_DISMISSAL_KEY, String(Date.now()));
        }
        catch { /* Continue when storage is unavailable. */ }
        setOpen(false);
    }
    if (!open)
        return null;
    return _jsx("div", { className: "fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm", role: "presentation", onMouseDown: (event) => { if (event.target === event.currentTarget)
            close(); }, children: _jsxs("section", { className: "launch-offer-modal w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl", role: "dialog", "aria-modal": "true", "aria-labelledby": "launch-offer-title", "aria-describedby": "launch-offer-description", children: [_jsxs("div", { className: "relative overflow-hidden bg-navy-900 px-6 pb-7 pt-6 text-white sm:px-8 sm:pt-8", children: [_jsx("div", { className: "launch-offer-glow", "aria-hidden": "true" }), _jsx("button", { type: "button", onClick: close, className: "absolute right-4 top-4 rounded-full p-2 text-white/75 transition hover:bg-white/10 hover:text-white", "aria-label": "Close launch offer reminder", children: _jsx(X, { size: 20 }) }), _jsxs("div", { className: "relative flex items-start gap-3 pr-8", children: [_jsx("div", { className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-amber text-navy-900", children: _jsx(BadgePercent, { size: 23 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold uppercase tracking-[0.2em] text-primary-amber", children: "Giglify launch offer" }), _jsx("h2", { id: "launch-offer-title", className: "mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl", children: "Unlock more tasks for less." })] })] }), _jsx("p", { id: "launch-offer-description", className: "relative mt-5 max-w-xl text-sm leading-relaxed text-slate-200 sm:text-base", children: "Choose a package at its limited one-time launch price. Regular prices are shown clearly so you can see exactly how much you save." })] }), _jsxs("div", { className: "bg-[var(--bg-elevated)] p-5 sm:p-7", children: [_jsx("div", { className: "grid gap-3 sm:grid-cols-3", children: LAUNCH_OFFERS.map((offer, index) => _jsxs("article", { className: `launch-offer-card rounded-2xl border p-4 ${index === 1 ? "launch-offer-card-featured" : ""}`, children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("h3", { className: "font-display text-lg", children: offer.tier }), index === 1 && _jsx("span", { className: "rounded-full bg-primary-amber px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-navy-900", children: "Popular" })] }), _jsxs("div", { className: "mt-4 flex items-end gap-2", children: [_jsxs("strong", { className: "font-display text-3xl text-brand-700 dark:text-brand-300", children: ["$", offer.offerPriceUsd] }), _jsxs("span", { className: "pb-1 text-sm text-[var(--text-muted)] line-through", children: ["$", offer.regularPriceUsd] })] }), _jsxs("p", { className: "mt-1 text-xs font-semibold text-accent-green", children: ["Save $", offer.savingsUsd] }), _jsx("p", { className: "mt-3 text-xs leading-relaxed text-[var(--text-muted)]", children: offer.detail }), _jsx("p", { className: "mt-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]", children: "1 month access" })] }, offer.tier)) }), _jsxs("div", { className: "mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between", children: [_jsx("button", { type: "button", onClick: close, className: "text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)]", children: "Remind me later" }), _jsxs("button", { type: "button", onClick: () => { close(); navigate("/auth"); }, className: "btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold", children: ["See launch offers ", _jsx(ArrowRight, { size: 17 })] })] }), _jsx("p", { className: "mt-4 text-center text-[11px] leading-relaxed text-[var(--text-muted)]", children: "Offer availability is limited. Package access starts after verified payment." })] })] }) });
}
//# sourceMappingURL=LaunchOfferModal.js.map