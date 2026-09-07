import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
const COOKIE_KEY = "giglify:cookie-consent:v1";
export default function CookieBanner() {
    const [visible, setVisible] = useState(() => localStorage.getItem(COOKIE_KEY) !== "accepted");
    if (!visible)
        return null;
    const accept = () => {
        localStorage.setItem(COOKIE_KEY, "accepted");
        setVisible(false);
    };
    return (_jsx("aside", { className: "fixed bottom-0 inset-x-0 z-[55] border-t p-4 shadow-2xl", "data-aos": "fade-up", style: { background: "var(--bg-elevated)", borderColor: "var(--border)", color: "var(--text)" }, role: "region", "aria-label": "Cookie notice", children: _jsxs("div", { className: "container flex flex-col md:flex-row md:items-center gap-3 md:gap-6", "data-aos": "fade-up", "data-aos-delay": "80", children: [_jsxs("p", { className: "text-sm flex-1", style: { color: "var(--text-muted)" }, children: ["We use essential cookies and local storage to keep Giglify secure and remember preferences. ", _jsx(Link, { to: "/about", className: "text-brand-600 dark:text-brand-300 font-semibold", children: "Read our data policy." })] }), _jsx("button", { type: "button", onClick: accept, className: "btn-primary text-sm shrink-0", children: "Accept" })] }) }));
}
//# sourceMappingURL=CookieBanner.js.map