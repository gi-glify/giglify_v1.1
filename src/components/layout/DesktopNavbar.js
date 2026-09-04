import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Bell, Wallet, Moon, Sun, ChevronDown, LogOut, User as UserIcon, } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { PRIMARY_NAV_ITEMS } from "../../config/navigation";
import { useAuthStore } from "../../store/authStore";
export default function DesktopNavbar({ onLogout }) {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuthStore();
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    useEffect(() => {
        const onClick = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target))
                setMenuOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);
    return (_jsxs("header", { className: "hidden md:flex sticky top-0 z-30 items-center justify-between px-6 py-3 border-b backdrop-blur", style: {
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--bg-elevated) 92%, transparent)",
        }, children: [_jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("img", { src: "/giglify.svg", alt: "Giglify Logo", className: "h-8 w-8 object-contain flex-shrink-0" }), _jsx("span", { className: "text-lg font-bold whitespace-nowrap", style: { fontFamily: '"Space Grotesk", sans-serif' }, children: "Giglify" })] }), _jsx("nav", { className: "flex items-center gap-1", "aria-label": "Primary", children: PRIMARY_NAV_ITEMS.map((item) => (_jsx(NavLink, { to: item.path, className: ({ isActive }) => `px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive
                                ? "bg-brand-100 text-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                                : "hover:bg-black/5 dark:hover:bg-white/5"}`, children: item.label }, item.path))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(NavLink, { to: "/financials", className: "btn-icon flex items-center gap-1.5 px-3", "aria-label": "Wallet balance", children: [_jsx(Wallet, { size: 18 }), _jsxs("span", { className: "text-sm font-semibold", children: ["$", (user?.balance ?? 0).toFixed(2)] })] }), _jsxs(NavLink, { to: "/notifications", className: "btn-icon relative", "aria-label": "Notifications", children: [_jsx(Bell, { size: 18 }), _jsx("span", { className: "absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" })] }), _jsx("button", { onClick: toggleTheme, className: "btn-icon", "aria-label": "Toggle theme", children: theme === "light" ? _jsx(Moon, { size: 18 }) : _jsx(Sun, { size: 18 }) }), _jsxs("div", { className: "relative", ref: menuRef, children: [_jsxs("button", { onClick: () => setMenuOpen((v) => !v), className: "flex items-center gap-2 pl-2 pr-1 py-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold", children: user?.firstName?.[0]?.toUpperCase() || _jsx(UserIcon, { size: 16 }) }), _jsx(ChevronDown, { size: 14 })] }), menuOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-52 rounded-lg shadow-lg border py-1 animate-in", style: {
                                    background: "var(--bg-elevated)",
                                    borderColor: "var(--border)",
                                }, children: [_jsxs(NavLink, { to: "/profile", onClick: () => setMenuOpen(false), className: "flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5", children: [_jsx(UserIcon, { size: 16 }), " My profile"] }), _jsx(NavLink, { to: "/settings", onClick: () => setMenuOpen(false), className: "block px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/5", children: "Settings" }), _jsxs("button", { onClick: onLogout, className: "w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30", children: [_jsx(LogOut, { size: 16 }), " Log out"] })] }))] })] })] }));
}
//# sourceMappingURL=DesktopNavbar.js.map