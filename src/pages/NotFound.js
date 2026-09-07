import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
export default function NotFoundPage() {
    return (_jsx("main", { className: "min-h-screen flex items-center justify-center p-6", style: { background: "var(--bg)", color: "var(--text)" }, children: _jsxs("section", { className: "card max-w-md w-full text-center", children: [_jsx(Compass, { size: 42, className: "mx-auto mb-4 text-brand-600 dark:text-brand-300" }), _jsx("p", { className: "text-sm font-semibold text-brand-600 dark:text-brand-300 mb-2", children: "404" }), _jsx("h1", { className: "font-display text-3xl mb-3", children: "This page wandered off" }), _jsx("p", { className: "text-sm mb-6", style: { color: "var(--text-muted)" }, children: "The link may be outdated or the page may have moved." }), _jsx(Link, { to: "/", className: "btn-primary inline-flex", children: "Return home" })] }) }));
}
//# sourceMappingURL=NotFound.js.map