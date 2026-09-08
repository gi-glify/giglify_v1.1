import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, Moon, Sun, LogOut, Menu, X, User, Settings, Mail, ShieldCheck, FileText, ExternalLink, ClipboardCheck, ChevronRight } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { PRIMARY_NAV_ITEMS } from "../../config/navigation";
import { useAuthStore } from "../../store/authStore";
import { fetchNotifications, formatNotificationTime, NOTIFICATION_EVENT } from "../../lib/notifications";
export function MobileTopBar({ onLogout }) {
    const { theme, toggleTheme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        if (!user)
            return;
        fetchNotifications(user.id, 5).then(setNotifications).catch(() => setNotifications([]));
        const onNotification = (event) => setNotifications((current) => [event.detail, ...current].slice(0, 5));
        window.addEventListener(NOTIFICATION_EVENT, onNotification);
        return () => window.removeEventListener(NOTIFICATION_EVENT, onNotification);
    }, [user?.id]);
    return (_jsxs("header", { className: "md:hidden sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b", style: {
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)",
        }, children: [_jsx("img", { src: "/giglify.svg", alt: "Giglify", className: "h-10 w-10 rounded-lg" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: toggleTheme, className: "btn-icon", "aria-label": "Toggle theme", children: theme === "light" ? _jsx(Moon, { size: 18 }) : _jsx(Sun, { size: 18 }) }), _jsxs("div", { className: "relative", children: [_jsxs("button", { onClick: () => setOpen((value) => !value), className: "btn-icon relative", "aria-label": "Notifications", "aria-expanded": open, children: [_jsx(Bell, { size: 18 }), notifications.some((item) => !item.read) && _jsx("span", { className: "absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" })] }), open && _jsxs("div", { className: "absolute right-0 mt-2 w-72 rounded-xl shadow-lg border p-2 z-40", style: { background: "var(--bg-elevated)", borderColor: "var(--border)" }, children: [notifications.slice(0, 3).map((item) => _jsxs("button", { onClick: () => { setOpen(false); navigate('/notifications'); }, className: "w-full text-left rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5", children: [_jsx("strong", { className: "block text-sm", children: item.title }), _jsx("span", { className: "block text-xs mt-1", style: { color: "var(--text-muted)" }, children: item.detail }), _jsx("span", { className: "block text-[11px] mt-1", style: { color: "var(--text-muted)" }, children: formatNotificationTime(item.createdAt) })] }, item.id)), _jsx("button", { onClick: () => { setOpen(false); navigate('/notifications'); }, className: "w-full border-t mt-1 pt-2 text-sm font-semibold text-brand-600 dark:text-brand-300", children: "Show all" })] })] }), _jsx("button", { onClick: onLogout, className: "btn-icon text-red-600 dark:text-red-400", title: "Log out", "aria-label": "Log out", children: _jsx(LogOut, { size: 18 }) })] })] }));
}
const DRAWER_LINKS = [
    { label: "My profile", path: "/profile", icon: User },
    { label: "Notifications", path: "/notifications", icon: Bell },
    { label: "Settings", path: "/settings", icon: Settings },
    { label: "Requester KYC", path: "/requester/apply", icon: ShieldCheck },
    { label: "Post a task", path: "/requester/tasks", icon: ClipboardCheck },
    { label: "Contact team", path: "/contact", icon: Mail },
    { label: "Privacy", path: "/about#privacy", icon: ShieldCheck },
    { label: "Data policy", path: "/about#data-policy", icon: FileText },
    { label: "Terms", path: "/about#terms", icon: ExternalLink },
];
export function MobileBottomNav({ onLogout }) {
    const [drawerOpen, setDrawerOpen] = useState(false);
    const location = useLocation();
    useEffect(() => {
        if (!drawerOpen)
            return;
        const closeOnEscape = (event) => {
            if (event.key === "Escape")
                setDrawerOpen(false);
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [drawerOpen]);
    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname, location.hash]);
    return (_jsxs(_Fragment, { children: [drawerOpen && (_jsx("div", { className: "md:hidden fixed inset-0 z-40 bg-black/40", role: "presentation", onClick: () => setDrawerOpen(false), children: _jsxs("aside", { className: "absolute right-0 top-0 bottom-0 w-[min(88vw,360px)] p-5 overflow-y-auto shadow-2xl animate-in", style: { background: "var(--bg-elevated)", color: "var(--text)" }, role: "dialog", "aria-modal": "true", "aria-label": "More Giglify pages", onClick: (event) => event.stopPropagation(), children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300", children: "Giglify" }), _jsx("h2", { className: "font-display text-xl", children: "More options" })] }), _jsx("button", { type: "button", className: "btn-icon", onClick: () => setDrawerOpen(false), "aria-label": "Close menu", children: _jsx(X, { size: 20 }) })] }), _jsx("nav", { className: "space-y-1", "aria-label": "More pages", children: DRAWER_LINKS.map((item) => {
                                const Icon = item.icon;
                                return (_jsxs(NavLink, { to: item.path, className: "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5", children: [_jsx(Icon, { size: 18, className: "text-brand-600 dark:text-brand-300" }), _jsx("span", { className: "flex-1", children: item.label }), _jsx(ChevronRight, { size: 16, style: { color: "var(--text-muted)" } })] }, item.path));
                            }) }), _jsxs("button", { type: "button", onClick: onLogout, className: "w-full flex items-center gap-3 rounded-xl px-3 py-3 mt-5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30", children: [_jsx(LogOut, { size: 18 }), "Sign out"] })] }) })), _jsx("nav", { className: "md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-stretch", style: {
                    borderColor: "var(--border)",
                    background: "var(--bg-elevated)",
                    paddingBottom: "env(safe-area-inset-bottom)",
                }, "aria-label": "Primary", children: PRIMARY_NAV_ITEMS.map((item) => {
                    if (item.path === "/profile") {
                        return (_jsxs("button", { type: "button", onClick: () => setDrawerOpen(true), className: `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${drawerOpen ? "text-brand-600 dark:text-brand-300" : "text-stone-500 dark:text-stone-400"}`, "aria-label": "Open menu", "aria-expanded": drawerOpen, children: [_jsx(Menu, { size: 20, className: drawerOpen ? "" : "opacity-80" }), "Menu"] }, "mobile-menu"));
                    }
                    return (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${isActive
                            ? "text-brand-600 dark:text-brand-300"
                            : "text-stone-500 dark:text-stone-400"}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx(item.icon, { size: 20, className: isActive ? "" : "opacity-80" }), item.label] })) }, item.path));
                }) })] }));
}
//# sourceMappingURL=MobileShell.js.map