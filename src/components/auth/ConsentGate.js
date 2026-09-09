import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { supabase } from "../../utils/supabase";
export const TERMS_VERSION = "2026-09-09";
export default function ConsentGate({ children }) {
    const user = useAuthStore((state) => state.user);
    const [accepted, setAccepted] = useState(null);
    const [checked, setChecked] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        if (!user)
            return;
        let cancelled = false;
        supabase.from("profiles").select("terms_accepted_at, terms_version").eq("id", user.id).maybeSingle().then(({ data, error: queryError }) => {
            if (cancelled)
                return;
            if (queryError)
                setError("We could not verify your terms consent. Please try again.");
            setAccepted(Boolean(data?.terms_accepted_at && data.terms_version === TERMS_VERSION));
        });
        return () => { cancelled = true; };
    }, [user?.id]);
    if (!user || accepted === true)
        return _jsx(_Fragment, { children: children });
    if (accepted === null)
        return _jsx("div", { className: "min-h-screen", style: { background: "var(--bg)" } });
    const userId = user.id;
    async function acceptTerms() {
        setSaving(true);
        setError("");
        const acceptedAt = new Date().toISOString();
        const { data, error: saveError } = await supabase
            .from("profiles")
            .upsert({
            id: userId,
            email: user?.email || null,
            terms_accepted_at: acceptedAt,
            terms_version: TERMS_VERSION,
        }, { onConflict: "id" })
            .select("terms_accepted_at, terms_version")
            .single();
        if (saveError || !data?.terms_accepted_at || data.terms_version !== TERMS_VERSION) {
            setError("We could not save your consent. Please try again.");
        }
        else
            setAccepted(true);
        setSaving(false);
    }
    return (_jsx("div", { className: "fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm", children: _jsxs("section", { className: "card max-w-lg w-full shadow-2xl", "data-aos": "zoom-in", role: "dialog", "aria-modal": "true", "aria-labelledby": "consent-title", children: [_jsx("h1", { id: "consent-title", className: "font-display text-2xl mb-3", children: "Before you continue" }), _jsx("p", { className: "text-sm mb-4", style: { color: "var(--text-muted)" }, children: "By using Giglify, you agree to our Terms of Use, Privacy Policy, and Data Policy. Your consent is saved to your account with the current policy version." }), _jsx(Link, { to: "/terms-of-use", target: "_blank", className: "text-sm text-brand-600 dark:text-brand-300 font-semibold", children: "Read the full terms and policies" }), _jsxs("label", { className: "flex items-start gap-3 mt-5 text-sm", children: [_jsx("input", { type: "checkbox", checked: checked, onChange: (event) => setChecked(event.target.checked), className: "mt-1" }), _jsx("span", { children: "I agree to the Giglify terms and policies." })] }), error && _jsx("p", { className: "alert alert-error text-sm mt-4", children: error }), _jsx("button", { type: "button", onClick: acceptTerms, disabled: !checked || saving, className: "btn-primary w-full mt-5 disabled:opacity-50", children: saving ? "Saving..." : "Agree and continue" })] }) }));
}
//# sourceMappingURL=ConsentGate.js.map