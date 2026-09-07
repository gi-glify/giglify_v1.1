import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
export default function ThankYouPage() {
    return (_jsx("main", { className: "min-h-screen flex items-center justify-center p-6", style: { background: "var(--bg)", color: "var(--text)" }, children: _jsxs("section", { className: "card max-w-md w-full text-center", children: [_jsx(CheckCircle2, { size: 44, className: "mx-auto mb-4 text-green-600 dark:text-green-400" }), _jsx("h1", { className: "font-display text-3xl mb-3", children: "Thank you" }), _jsx("p", { className: "text-sm mb-6", style: { color: "var(--text-muted)" }, children: "Your message was sent to the Giglify team. We will get back to you as soon as possible." }), _jsx(Link, { to: "/", className: "btn-primary inline-flex", children: "Return home" })] }) }));
}
//# sourceMappingURL=ThankYou.js.map