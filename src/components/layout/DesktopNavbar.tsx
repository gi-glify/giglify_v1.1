import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
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

interface DesktopNavbarProps {
  onLogout: () => void;
}

export default function DesktopNavbar({ onLogout }: DesktopNavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

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

        <NavLink
          to="/notifications"
          className="btn-icon relative"
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </NavLink>

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
            <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold">
              {user?.firstName?.[0]?.toUpperCase() || <UserIcon size={16} />}
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
