import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
import { Menu, Bell, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { usePlatform } from '../../hooks/usePlatform';
import { PRIMARY_NAV_ITEMS } from '../../config/navigation';
export function MobileTopBar({ onOpenDrawer }) {
    const { theme, toggleTheme } = useTheme();
    const { setOverride } = usePlatform();
    return (_jsxs("header", { className: "md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 border-b", style: { borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--bg-elevated) 92%, transparent)' }, children: [_jsx("button", { onClick: onOpenDrawer, className: "btn-icon", "aria-label": "Open menu", children: _jsx(Menu, { size: 20 }) }), _jsx("img", { src: "/giglify.svg", alt: "Giglify", className: "h-10 w-10 rounded-lg" }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("button", { onClick: () => setOverride('desktop'), className: "btn-icon", title: "Switch to desktop view", "aria-label": "Switch to desktop view", children: _jsx(Monitor, { size: 18 }) }), _jsx("button", { onClick: toggleTheme, className: "btn-icon", "aria-label": "Toggle theme", children: theme === 'light' ? _jsx(Moon, { size: 18 }) : _jsx(Sun, { size: 18 }) }), _jsxs(NavLink, { to: "/notifications", className: "btn-icon relative", "aria-label": "Notifications", children: [_jsx(Bell, { size: 18 }), _jsx("span", { className: "absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" })] })] })] }));
}
export function MobileBottomNav() {
    return (_jsx("nav", { className: "md:hidden fixed bottom-0 left-0 right-0 z-30 border-t flex items-stretch", style: { borderColor: 'var(--border)', background: 'var(--bg-elevated)', paddingBottom: 'env(safe-area-inset-bottom)' }, "aria-label": "Primary", children: PRIMARY_NAV_ITEMS.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-semibold transition-colors ${isActive ? 'text-brand-600 dark:text-brand-300' : 'text-stone-500 dark:text-stone-400'}`, children: ({ isActive }) => (_jsxs(_Fragment, { children: [_jsx(item.icon, { size: 20, className: isActive ? '' : 'opacity-80' }), item.label] })) }, item.path))) }));
}
//# sourceMappingURL=MobileShell.js.map