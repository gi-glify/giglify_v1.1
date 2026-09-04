import { NavLink } from "react-router-dom";
import { Bell, Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { PRIMARY_NAV_ITEMS } from "../../config/navigation";

interface MobileTopBarProps {
  onLogout: () => void;
}

export function MobileTopBar({ onLogout }: MobileTopBarProps) {
  const { theme, toggleTheme } = useTheme();

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
        <NavLink
          to="/notifications"
          className="btn-icon relative"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </NavLink>
        <button
          onClick={onLogout}
          className="btn-icon text-red-600 dark:text-red-400"
          title="Log out"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-stretch"
      style={{
        borderColor: "var(--border)",
        background: "var(--bg-elevated)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
      aria-label="Primary"
    >
      {PRIMARY_NAV_ITEMS.map((item) => (
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
      ))}
    </nav>
  );
}
