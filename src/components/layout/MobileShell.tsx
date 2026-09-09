import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, Moon, Sun, LogOut, Menu, User, Settings, Mail, ShieldCheck, FileText, ExternalLink, ClipboardCheck } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { PRIMARY_NAV_ITEMS } from "../../config/navigation";
import { useAuthStore } from "../../store/authStore";
import { AppNotification, fetchNotifications, formatNotificationTime, NOTIFICATION_EVENT } from "../../lib/notifications";

interface MobileTopBarProps {
  onLogout: () => void;
}

export function MobileTopBar({ onLogout }: MobileTopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications(user.id, 5).then(setNotifications).catch(() => setNotifications([]));
    const onNotification = (event: Event) => setNotifications((current) => [(event as CustomEvent<AppNotification>).detail, ...current].slice(0, 5));
    window.addEventListener(NOTIFICATION_EVENT, onNotification);
    return () => window.removeEventListener(NOTIFICATION_EVENT, onNotification);
  }, [user?.id]);

  return (
    <header
      className="md:hidden sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)",
      }}
    >
      <img src="/giglify.svg" alt="Giglify" className="h-10 w-10 rounded-lg" />
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          className="btn-icon"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="relative">
          <button onClick={() => setOpen((value) => !value)} className="btn-icon relative" aria-label="Notifications" aria-expanded={open}>
            <Bell size={18} />
            {notifications.some((item) => !item.read) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />}
          </button>
          {open && <div className="absolute right-0 mt-2 w-72 rounded-xl shadow-lg border p-2 z-40" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
            {notifications.slice(0, 3).map((item) => <button key={item.id} onClick={() => { setOpen(false); navigate('/notifications'); }} className="w-full text-left rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5"><strong className="block text-sm">{item.title}</strong><span className="block text-xs mt-1" style={{ color: "var(--text-muted)" }}>{item.detail}</span><span className="block text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>{formatNotificationTime(item.createdAt)}</span></button>)}
            <button onClick={() => { setOpen(false); navigate('/notifications'); }} className="w-full border-t mt-1 pt-2 text-sm font-semibold text-brand-600 dark:text-brand-300">Show all</button>
          </div>}
        </div>
        <div className="relative">
          <button
            onClick={() => setProfileOpen((value) => !value)}
            className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold overflow-hidden ring-2 ring-transparent hover:ring-brand-300 transition-all"
            aria-label="Open profile menu"
            aria-expanded={profileOpen}
          >
            {user?.profilePicture ? <img src={user.profilePicture} alt="Profile" className="w-full h-full object-cover" /> : user?.firstName?.[0]?.toUpperCase() || <User size={17} />}
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl shadow-lg border p-2 z-40" style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}>
              <div className="px-3 py-2 border-b mb-1" style={{ borderColor: "var(--border)" }}>
                <p className="text-sm font-semibold truncate">{user?.firstName || "Your account"}</p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user?.email}</p>
              </div>
              <NavLink to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
                <User size={16} /> My profile
              </NavLink>
              <NavLink to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
                <Settings size={16} /> Settings
              </NavLink>
              <NavLink to="/contact" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5">
                <Mail size={16} /> Contact team
              </NavLink>
              <button onClick={onLogout} className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface MobileBottomNavProps {
  onLogout: () => void;
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
  { label: "Terms", path: "/terms-of-use", icon: ExternalLink },
];

export function MobileBottomNav({ onLogout }: MobileBottomNavProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (drawerOpen) {
      setDrawerMounted(true);
      return;
    }
    if (!drawerMounted) return;
    const unmount = window.setTimeout(() => setDrawerMounted(false), 300);
    return () => window.clearTimeout(unmount);
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  useEffect(() => {
    closeDrawer();
  }, [location.pathname, location.hash]);

  const openDrawer = () => {
    setDrawerMounted(true);
    requestAnimationFrame(() => setDrawerOpen(true));
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      {drawerMounted && (
        <div className={`md:hidden fixed inset-0 z-40 flex items-end bg-black/40 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`} role="presentation" onClick={closeDrawer}>
          <aside
            className={`w-full max-h-[84vh] overflow-y-auto rounded-t-[28px] px-5 pb-8 pt-3 shadow-2xl transform transition-transform duration-300 ease-out ${drawerOpen ? "translate-y-0" : "translate-y-full"}`}
            style={{ background: "var(--bg-elevated)", color: "var(--text)" }}
            role="dialog"
            aria-modal="true"
            aria-label="Giglify tools and account"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-5 h-1.5 w-11 rounded-full bg-black/10 dark:bg-white/15" aria-hidden="true" />
            <div className="flex items-start justify-between mb-5 px-1">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>More workspace</p>
                <h2 className="font-display text-2xl mt-1">Tools and account</h2>
              </div>
              <button type="button" className="rounded-full px-4 py-2 text-sm font-semibold bg-black/5 dark:bg-white/10" onClick={closeDrawer} aria-label="Close menu">Close</button>
            </div>
            <nav className="grid grid-cols-2 gap-3" aria-label="More pages">
              {DRAWER_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className="flex items-center gap-3 rounded-full border px-4 py-4 text-sm font-semibold hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Icon size={19} className="shrink-0 text-brand-600 dark:text-brand-300" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 rounded-full border px-4 py-3 mt-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              style={{ borderColor: "var(--border)" }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </aside>
        </div>
      )}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-stretch"
        style={{
          borderColor: "var(--border)",
          background: "var(--bg-elevated)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Primary"
      >
        {PRIMARY_NAV_ITEMS.map((item) => {
          if (item.path === "/profile") {
            return (
              <button
                key="mobile-menu"
                type="button"
                onClick={openDrawer}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${drawerOpen ? "text-brand-600 dark:text-brand-300" : "text-stone-500 dark:text-stone-400"}`}
                aria-label="Open menu"
                aria-expanded={drawerOpen}
              >
                <Menu size={20} className={drawerOpen ? "" : "opacity-80"} />
                Menu
              </button>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? "text-brand-600 dark:text-brand-300"
                    : "text-stone-500 dark:text-stone-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={20} className={isActive ? "" : "opacity-80"} />
                  {item.label}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </>
  );
}
