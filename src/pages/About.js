import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
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
    const [state, setState] = useState("idle");
    useEffect(() => {
        if (location.hash) {
            window.setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: "smooth" }), 0);
        }
    }, [location.hash]);
    async function submitContact(event) {
        event.preventDefault();
        setState("sending");
        const { error } = await supabase.functions.invoke("contact-team", { body: { name, email, message } });
        setState(error ? "error" : "sent");
        if (!error) {
            setMessage("");
            navigate("/thank-you");
        }
    }
    return (_jsx("div", { className: "min-h-screen", style: { background: "var(--bg)", color: "var(--text)" }, children: _jsxs("main", { className: "container max-w-4xl py-10 space-y-8", children: [_jsxs("section", { className: "card", "data-aos": "fade-up", children: [_jsx("p", { className: "text-sm font-semibold text-brand-600 dark:text-brand-300 mb-2", children: "About Giglify" }), _jsx("h1", { className: "font-display text-3xl mb-3", children: "Small tasks. Clear rules. Fairer work." }), _jsx("p", { style: { color: "var(--text-muted)" }, children: "Giglify connects people with focused microtasks, transparent task requirements, and accountable review." })] }), _jsxs("section", { className: "grid gap-4 md:grid-cols-2", children: [_jsxs("article", { id: "privacy", className: "card scroll-mt-24", children: [_jsx(ShieldCheck, { className: "text-brand-600 dark:text-brand-300 mb-3", size: 24 }), _jsx("h2", { className: "font-display text-xl mb-2", children: "Privacy policy" }), _jsx("p", { className: "text-sm", style: { color: "var(--text-muted)" }, children: "We use account, profile, task, payment, and support data to provide Giglify services, protect accounts, review work, process payouts, and improve reliability. We do not sell personal data. Payment credentials are handled by the relevant payment provider." })] }), _jsxs("article", { id: "data-policy", className: "card scroll-mt-24", children: [_jsx(CheckCircle2, { className: "text-brand-600 dark:text-brand-300 mb-3", size: 24 }), _jsx("h2", { className: "font-display text-xl mb-2", children: "Data policy" }), _jsx("p", { className: "text-sm", style: { color: "var(--text-muted)" }, children: "Task answers may be retained for quality review, fraud prevention, dispute resolution, and payment records. AI grading uses task answers and rubrics only for grading. You may request access, correction, or deletion where legal and operational retention requirements allow." })] })] }), _jsxs("section", { className: "card", children: [_jsx("h2", { id: "terms", className: "font-display text-xl mb-2 scroll-mt-24", children: "Terms of use" }), _jsxs("div", { className: "text-sm space-y-2", style: { color: "var(--text-muted)" }, children: [_jsx("p", { children: "Use one honest account, provide accurate information, submit original work, and follow each task's instructions." }), _jsx("p", { children: "Giglify may review, reject, or hold submissions and payments when work is incomplete, duplicated, abusive, fraudulent, or requires manual review." }), _jsx("p", { children: "Payments are governed by the published grading thresholds, verification requirements, payout rules, and applicable provider terms." }), _jsx("p", { children: "We may update these policies. A new version may require renewed consent before continued use." })] })] }), _jsxs("section", { id: "contact", className: "card max-w-2xl scroll-mt-24", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Mail, { className: "text-brand-600 dark:text-brand-300", size: 20 }), _jsx("h2", { className: "font-display text-xl", children: "Contact the team" })] }), _jsxs("p", { className: "text-sm mb-5", style: { color: "var(--text-muted)" }, children: ["Email: ", _jsx("a", { className: "text-brand-600 dark:text-brand-300 font-semibold", href: `mailto:${TEAM_EMAIL}`, children: TEAM_EMAIL })] }), _jsxs("form", { onSubmit: submitContact, className: "space-y-4", children: [_jsx("input", { className: "input-field w-full", value: name, onChange: (event) => setName(event.target.value), placeholder: "Your name", required: true, minLength: 2, maxLength: 100 }), _jsx("input", { className: "input-field w-full", type: "email", value: email, onChange: (event) => setEmail(event.target.value), placeholder: "Your email", required: true, maxLength: 320 }), _jsx("textarea", { className: "input-field w-full min-h-32", value: message, onChange: (event) => setMessage(event.target.value), placeholder: "How can we help?", required: true, minLength: 10, maxLength: 5000 }), state === "sent" && _jsx("p", { className: "alert alert-success text-sm", children: "Your message was sent to the Giglify team." }), state === "error" && _jsx("p", { className: "alert alert-error text-sm", children: "We could not send your message. Please try again." }), _jsx("button", { className: "btn-primary", disabled: state === "sending", children: state === "sending" ? "Sending..." : "Send message" })] })] })] }) }));
}
//# sourceMappingURL=About.js.map