import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppNotification, NOTIFICATION_EVENT } from '../../lib/notifications';

export default function NotificationToast() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<AppNotification | null>(null);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      setNotification((event as CustomEvent<AppNotification>).detail);
    };
    window.addEventListener(NOTIFICATION_EVENT, handleNotification);
    return () => window.removeEventListener(NOTIFICATION_EVENT, handleNotification);
  }, []);

  if (!notification) return null;
  return (
    <button
      type="button"
      onClick={() => { setNotification(null); navigate('/notifications'); }}
      className="fixed right-4 bottom-20 md:bottom-6 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border p-4 text-left shadow-2xl animate-in"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--text)' }}
      aria-label="Open notification"
    >
      <span className="flex items-start gap-3"><span className="rounded-full bg-brand-100 dark:bg-brand-900/40 p-2 text-brand-700 dark:text-brand-300"><Bell size={16} /></span><span><strong className="block text-sm">{notification.title}</strong><span className="block text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{notification.detail}</span></span></span>
    </button>
  );
}
