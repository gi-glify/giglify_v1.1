import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import DesktopNavbar from "./DesktopNavbar";
import { MobileTopBar, MobileBottomNav } from "./MobileShell";
import AIChatWidget from "../ai/AIChatWidget";
import NotificationToast from "../ui/NotificationToast";
import { usePlatform } from "../../hooks/usePlatform";
import { useAuthStore } from "../../store/authStore";
import { signOut } from "../../utils/supabase";
/**
 * Wraps every authenticated page. Uses top navbar for desktop
 * and top bar + bottom navigation for mobile. Initializes AOS
 * scroll animations once per mount.
 */
export default function AppLayout({ children }) {
    const { mode } = usePlatform();
    const { setUser } = useAuthStore();
    const navigate = useNavigate();
    useEffect(() => {
        AOS.init({ duration: 600, once: true, easing: "ease-out", offset: 40 });
    }, []);
    useEffect(() => {
        AOS.refreshHard();
    }, [mode]);
    const handleLogout = async () => {
        await signOut();
        setUser(null);
        navigate("/auth");
    };
    if (mode === "mobile") {
        return (_jsxs("div", { className: "min-h-screen flex flex-col", style: { background: "var(--bg)", color: "var(--text)" }, children: [_jsx(MobileTopBar, { onLogout: handleLogout }), _jsx("main", { className: "flex-1", children: children }), _jsx("div", { className: "mobile-nav-spacer" }), _jsx(MobileBottomNav, {}), _jsx(AIChatWidget, {}), _jsx(NotificationToast, {})] }));
    }
    return (_jsxs("div", { className: "min-h-screen flex flex-col", style: { background: "var(--bg)", color: "var(--text)" }, children: [_jsx(DesktopNavbar, { onLogout: handleLogout }), _jsx("main", { className: "flex-1", children: children }), _jsx(AIChatWidget, {}), _jsx(NotificationToast, {})] }));
}
//# sourceMappingURL=AppLayout.js.map