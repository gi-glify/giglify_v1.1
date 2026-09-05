import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuthStore } from "../store/authStore";
import { fetchNotifications, formatNotificationTime, markNotificationRead } from "../lib/notifications";
export default function NotificationsPage() {
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const user = useAuthStore((state) => state.user);
    useEffect(() => {
        if (!user)
            return;
        fetchNotifications(user.id).then(setNotifications).catch(() => setNotifications([])).finally(() => setLoading(false));
    }, [user?.id]);
    async function openNotification(notification) {
        if (notification.read)
            return;
        await markNotificationRead(notification.id).catch(() => undefined);
        setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    }
    return (_jsx("div", { className: "min-h-screen", style: { background: "var(--bg)", color: "var(--text)" }, children: _jsxs("main", { className: "container py-8 max-w-2xl", children: [_jsx("h1", { className: "font-display text-2xl mb-6", "data-aos": "fade-down", children: "Notifications" }), loading ? (_jsx("div", { className: "space-y-3", children: Array.from({ length: 3 }).map((_, i) => (_jsxs("div", { className: "card flex gap-3 items-center", children: [_jsx(Skeleton, { className: "h-10 w-10 rounded-full shrink-0" }), _jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(Skeleton, { className: "h-3 w-1/3" }), _jsx(Skeleton, { className: "h-3 w-2/3" })] })] }, i))) })) : (_jsx("div", { className: "space-y-3", children: notifications.map((n, i) => (_jsxs("div", { className: `card flex gap-3 items-start ${!n.read ? "border-brand-400" : ""}`, "data-aos": "fade-up", "data-aos-delay": i * 60, children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0", children: _jsx(Bell, { size: 18 }) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "font-semibold text-sm", children: n.title }), _jsx("p", { className: "text-sm", style: { color: "var(--text-muted)" }, children: n.detail })] }), _jsx("span", { className: "text-xs shrink-0", style: { color: "var(--text-muted)" }, children: formatNotificationTime(n.createdAt) }), !n.read && _jsx("button", { onClick: () => openNotification(n), className: "text-xs font-semibold text-brand-600 dark:text-brand-300", "aria-label": "Mark notification read", children: _jsx(Check, { size: 14 }) })] }, n.id))) }))] }) }));
}
//# sourceMappingURL=Notifications.js.map