import { useEffect, useRef, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppNotification, NOTIFICATION_EVENT } from '../../lib/notifications';

export default function NotificationToast() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [exiting, setExiting] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      setExiting(false);
      setNotification((event as CustomEvent<AppNotification>).detail);
    };
    window.addEventListener(NOTIFICATION_EVENT, handleNotification);
    return () => window.removeEventListener(NOTIFICATION_EVENT, handleNotification);
  }, []);

  useEffect(() => {
    if (!notification || notification.kind === 'danger') return;
    const timeout = window.setTimeout(() => dismiss(), 6000);
    return () => window.clearTimeout(timeout);
  }, [notification]);

  function dismiss() {
    setExiting(true);
    window.setTimeout(() => {
      setNotification(null);
      setExiting(false);
    }, 240);
  }

  if (!notification) return null;
  return (
    <div
      onClick={() => { if (swiped.current) { swiped.current = false; return; } dismiss(); navigate('/notifications'); }}
      onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null; swiped.current = false; }}
      onTouchEnd={(event) => { const start = touchStartX.current; const end = event.changedTouches[0]?.clientX; if (start !== null && end !== undefined && Math.abs(end - start) > 60) { swiped.current = true; dismiss(); } touchStartX.current = null; }}
      className={`fixed top-4 right-4 md:top-6 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border p-4 text-left shadow-2xl cursor-pointer ${exiting ? 'notification-toast-exit' : 'notification-toast-enter'} ${notification.kind === 'danger' ? 'border-red-500 bg-red-50 text-red-950 dark:bg-red-950/90 dark:text-red-100' : ''}`}
      style={notification.kind === 'danger' ? undefined : { background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }}
      role="status"
      aria-live="polite"
    >
      <span className="flex items-start gap-3"><span className={`rounded-full p-2 ${notification.kind === 'danger' ? 'bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-200' : 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'}`}><Bell size={16} /></span><span className="flex-1"><strong className="block text-sm">{notification.title}</strong><span className="block text-xs mt-1" style={notification.kind === 'danger' ? undefined : { color: 'var(--text-muted)' }}>{notification.detail}</span></span><button type="button" onClick={(event) => { event.stopPropagation(); dismiss(); }} className="btn-icon !h-7 !w-7 shrink-0" aria-label="Dismiss notification"><X size={15} /></button></span>
      {notification.kind !== 'danger' && <span className="notification-toast-timer" aria-hidden="true" />}
    </div>
  );
}
