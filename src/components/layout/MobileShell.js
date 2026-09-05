import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, Moon, Sun, LogOut } from "lucide-react";
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
export function MobileBottomNav() {
    return (_jsx("nav", { className: "md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-stretch", style: {
            borderColor: "var(--border)",
            background: "var(--bg-elevated)",
            paddingBottom: "env(safe-area-inset-bottom)",
        }, "aria-label": "Primary", children: PRIMARY_NAV_ITEMS.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${isActive
                ? "text-brand-600 dark:text-brand-300"
                : "text-stone-500 dark:text-stone-400"}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx(item.icon, { size: 20, className: isActive ? "" : "opacity-80" }), item.label] })) }, item.path))) }));
}
//# sourceMappingURL=MobileShell.js.map