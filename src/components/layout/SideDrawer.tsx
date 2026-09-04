import { NavLink } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { NAV_ITEMS } from '../../config/navigation';

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  /** 'push' for the permanent desktop rail, 'overlay' for the mobile drawer */
  variant?: 'push' | 'overlay';
}

export default function SideDrawer({ open, onClose, onLogout, variant = 'overlay' }: SideDrawerProps) {
  if (variant === 'push') {
    return (
      <aside
        className="hidden md:flex flex-col shrink-0 border-r overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          width: open ? '15rem' : '0rem',
          borderColor: 'var(--border)',
          background: 'var(--bg-elevated)',
        }}
      >
        <div className="w-60 p-4 flex flex-col h-full">
          <nav className="flex-1 space-y-1 mt-2" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200' : 'hover:bg-black/5 dark:hover:bg-white/5'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>
    );
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 shadow-xl transition-transform duration-300 ease-in-out flex flex-col ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'var(--bg-elevated)', color: 'var(--text)' }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <img src="/giglify.svg" alt="Giglify" className="h-10 w-10 rounded-lg" />
          <button onClick={onClose} className="btn-icon" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                  isActive ? 'bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200' : 'hover:bg-black/5 dark:hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </aside>
    </>
  );
}
