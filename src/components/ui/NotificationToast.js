import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NOTIFICATION_EVENT } from '../../lib/notifications';
export default function NotificationToast() {
    const navigate = useNavigate();
    const [notification, setNotification] = useState(null);
    const touchStartX = useRef(null);
    const swiped = useRef(false);
    useEffect(() => {
        const handleNotification = (event) => {
            setNotification(event.detail);
        };
        window.addEventListener(NOTIFICATION_EVENT, handleNotification);
        return () => window.removeEventListener(NOTIFICATION_EVENT, handleNotification);
    }, []);
    useEffect(() => {
        if (!notification)
            return;
        const timeout = window.setTimeout(() => setNotification(null), 6000);
        return () => window.clearTimeout(timeout);
    }, [notification]);
    if (!notification)
        return null;
    return (_jsx("div", { onClick: () => { if (swiped.current) {
            swiped.current = false;
            return;
        } setNotification(null); navigate('/notifications'); }, onTouchStart: (event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; swiped.current = false; }, onTouchEnd: (event) => { const start = touchStartX.current; const end = event.changedTouches[0]?.clientX; if (start !== null && end !== undefined && Math.abs(end - start) > 60) {
            swiped.current = true;
            setNotification(null);
        } touchStartX.current = null; }, className: "fixed right-4 bottom-20 md:bottom-6 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border p-4 text-left shadow-2xl animate-in cursor-pointer", style: { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }, role: "status", "aria-live": "polite", children: _jsxs("span", { className: "flex items-start gap-3", children: [_jsx("span", { className: "rounded-full bg-brand-100 dark:bg-brand-900/40 p-2 text-brand-700 dark:text-brand-300", children: _jsx(Bell, { size: 16 }) }), _jsxs("span", { className: "flex-1", children: [_jsx("strong", { className: "block text-sm", children: notification.title }), _jsx("span", { className: "block text-xs mt-1", style: { color: 'var(--text-muted)' }, children: notification.detail })] }), _jsx("button", { type: "button", onClick: (event) => { event.stopPropagation(); setNotification(null); }, className: "btn-icon !h-7 !w-7 shrink-0", "aria-label": "Dismiss notification", children: _jsx(X, { size: 15 }) })] }) }));
}
//# sourceMappingURL=NotificationToast.js.map