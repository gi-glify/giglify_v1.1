import { useEffect, useState } from "react";
import { Bell, CheckCircle2, DollarSign, ListChecks } from "lucide-react";
import { Skeleton } from "../components/ui/Skeleton";

interface DemoNotification {
  id: string;
  icon: typeof Bell;
  title: string;
  detail: string;
  time: string;
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<DemoNotification[]>([]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

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
                className="card flex gap-3 items-start"
                data-aos="fade-up"
                data-aos-delay={i * 60}
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center shrink-0">
                  <n.icon size={18} />
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
                  {n.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
