import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AOS from 'aos';
import DesktopNavbar from './DesktopNavbar';
import SideDrawer from './SideDrawer';
import { MobileTopBar, MobileBottomNav } from './MobileShell';
import AIChatWidget from '../ai/AIChatWidget';
import { usePlatform } from '../../hooks/usePlatform';
import { useAuthStore } from '../../store/authStore';
import { signOut } from '../../utils/supabase';
/**
 * Wraps every authenticated page. Picks the desktop shell (top navbar +
 * collapsible side drawer) or the mobile shell (top bar + bottom tab
 * bar + slide-in drawer) based on `usePlatform`, and initializes AOS
 * scroll animations once per mount.
 */
export default function AppLayout({ children }) {
    const { mode } = usePlatform();
    const { setUser } = useAuthStore();
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(mode === 'desktop');
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    useEffect(() => {
        AOS.init({ duration: 600, once: true, easing: 'ease-out', offset: 40 });
    }, []);
    useEffect(() => {
        AOS.refreshHard();
    }, [mode]);
    const handleLogout = async () => {
        await signOut();
        setUser(null);
        navigate('/auth');
    };
    if (mode === 'mobile') {
        return (_jsxs("div", { className: "min-h-screen flex flex-col", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx(MobileTopBar, { onOpenDrawer: () => setMobileDrawerOpen(true) }), _jsx(SideDrawer, { variant: "overlay", open: mobileDrawerOpen, onClose: () => setMobileDrawerOpen(false), onLogout: handleLogout }), _jsx("main", { className: "flex-1", children: children }), _jsx("div", { className: "mobile-nav-spacer" }), _jsx(MobileBottomNav, {}), _jsx(AIChatWidget, {})] }));
    }
    return (_jsxs("div", { className: "min-h-screen flex", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx(SideDrawer, { variant: "push", open: drawerOpen, onClose: () => setDrawerOpen(false), onLogout: handleLogout }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0", children: [_jsx(DesktopNavbar, { onToggleDrawer: () => setDrawerOpen((v) => !v) }), _jsx("main", { className: "flex-1", children: children })] }), _jsx(AIChatWidget, {})] }));
}
//# sourceMappingURL=AppLayout.js.map