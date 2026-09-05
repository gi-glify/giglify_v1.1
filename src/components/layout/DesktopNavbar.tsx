import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Wallet,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { PRIMARY_NAV_ITEMS } from "../../config/navigation";
import { useAuthStore } from "../../store/authStore";
import { AppNotification, fetchNotifications, formatNotificationTime, NOTIFICATION_EVENT } from "../../lib/notifications";

interface DesktopNavbarProps {
  onLogout: () => void;
}

export default function DesktopNavbar({ onLogout }: DesktopNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node))
        setNotificationOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id, 5).then(setNotifications).catch(() => setNotifications([]));
    const onNotification = (event: Event) => {
      const next = (event as CustomEvent<AppNotification>).detail;
      setNotifications((current) => [next, ...current.filter((item) => item.id !== next.id)].slice(0, 5));
    };
    window.addEventListener(NOTIFICATION_EVENT, onNotification);
    return () => window.removeEventListener(NOTIFICATION_EVENT, onNotification);
  }, [user?.id]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header
      className="hidden md:flex sticky top-0 z-30 items-center justify-between px-6 py-3 border-b backdrop-blur"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)",
      }}
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <img
            src="/giglify.svg"
            alt="Giglify Logo"
            className="h-8 w-8 object-contain flex-shrink-0"
          />
          <span
            className="text-lg font-bold whitespace-nowrap"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          >
            Giglify
          </span>
        </div>
        <nav className="flex items-center gap-1" aria-label="Primary">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                    : "hover:bg-black/5 dark:hover:bg-white/5"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <NavLink
          to="/financials"
          className="btn-icon flex items-center gap-1.5 px-3"
          aria-label="Wallet balance"
        >
          <Wallet size={18} />
          <span className="text-sm font-semibold">
            ${(user?.balance ?? 0).toFixed(2)}
          </span>
        </NavLink>

        <div className="relative" ref={notificationRef}>
          <button onClick={() => setNotificationOpen((value) => !value)} className="btn-icon relative" aria-label="Notifications" aria-expanded={notificationOpen}>
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] leading-4">{unreadCount}</span>}
          </button>
          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg border p-2 animate-in" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-2 py-2"><strong className="text-sm">Notifications</strong><span className="text-xs" style={{ color: "var(--text-muted)" }}>{unreadCount} unread</span></div>
              {notifications.length === 0 ? <p className="px-2 py-5 text-sm" style={{ color: "var(--text-muted)" }}>No notifications yet.</p> : notifications.slice(0, 3).map((item) => <button key={item.id} onClick={() => { setNotificationOpen(false); navigate('/notifications'); }} className="w-full text-left rounded-lg px-2 py-2 hover:bg-black/5 dark:hover:bg-white/5"><strong className="block text-sm">{item.title}</strong><span className="block text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.detail}</span><span className="block text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{formatNotificationTime(item.createdAt)}</span></button>)}
              <button onClick={() => { setNotificationOpen(false); navigate('/notifications'); }} className="w-full border-t mt-1 pt-2 text-sm font-semibold text-brand-600 dark:text-brand-300">Show all</button>
            </div>
          )}
        </div>

        <button
          onClick={toggleTheme}
          className="btn-icon"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
          >
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold overflow-hidden">
              {user?.profilePicture ? <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" /> : user?.firstName?.[0]?.toUpperCase() || <UserIcon size={16} />}
            </div>
            <ChevronDown size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-52 rounded-lg shadow-lg border py-1 animate-in"
              style={{
                background: "var(--bg-elevated)",
                borderColor: "var(--border)",
              }}
            >
              <NavLink
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                <UserIcon size={16} /> My profile
              </NavLink>
              <NavLink
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5"
              >
                Settings
              </NavLink>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                <LogOut size={16} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
