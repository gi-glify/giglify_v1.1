import { NavLink } from 'react-router-dom';
import { Menu, Bell, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePlatform } from '../../hooks/usePlatform';
import { PRIMARY_NAV_ITEMS } from '../../config/navigation';

export function MobileTopBar({ onOpenDrawer }: { onOpenDrawer: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { setOverride } = usePlatform();

  return (
    <header
      className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b"
      style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg-elevated) 92%, transparent)' }}
    >
      <button onClick={onOpenDrawer} className="btn-icon" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <img src="/giglify.svg" alt="Giglify" className="h-10 w-10 rounded-lg" />
      <div className="flex items-center gap-1">
        <button onClick={() => setOverride('desktop')} className="btn-icon" title="Switch to desktop view" aria-label="Switch to desktop view">
          <Monitor size={18} />
        </button>
        <button onClick={toggleTheme} className="btn-icon" aria-label="Toggle theme">
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <NavLink to="/notifications" className="btn-icon relative" aria-label="Notifications">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
        </NavLink>
      </div>
    </header>
  );
}

export function MobileBottomNav() {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-stretch"
      style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      {PRIMARY_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${
              isActive ? 'text-brand-600 dark:text-brand-300' : 'text-stone-500 dark:text-stone-400'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon size={20} className={isActive ? '' : 'opacity-80'} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
