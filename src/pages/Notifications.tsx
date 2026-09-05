import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";
import { useAuthStore } from "../store/authStore";
import { AppNotification, fetchNotifications, formatNotificationTime, markNotificationRead } from "../lib/notifications";

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id).then(setNotifications).catch(() => setNotifications([])).finally(() => setLoading(false));
  }, [user?.id]);

  async function openNotification(notification: AppNotification) {
    if (notification.read) return;
    await markNotificationRead(notification.id).catch(() => undefined);
    setNotifications((items) => items.map((item) => item.id === notification.id ? { ...item, read: true } : item));
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <main className="container py-8 max-w-2xl">
        <h1 className="font-display text-2xl mb-6" data-aos="fade-down">
          Notifications
        </h1>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div className="card flex gap-3 items-center" key={i}>
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n, i) => (
              <div
                key={n.id}
                className={`card flex gap-3 items-start ${!n.read ? "border-brand-400" : ""}`}
                data-aos="fade-up"
                data-aos-delay={i * 60}
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
                  <Bell size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{n.title}</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    {n.detail}
                  </p>
                </div>
                <span
                  className="text-xs shrink-0"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatNotificationTime(n.createdAt)}
                </span>
                {!n.read && <button onClick={() => openNotification(n)} className="text-xs font-semibold text-brand-600 dark:text-brand-300" aria-label="Mark notification read"><Check size={14} /></button>}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
