import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AOS from "aos";
import DesktopNavbar from "./DesktopNavbar";
import { MobileTopBar, MobileBottomNav } from "./MobileShell";
import AIChatWidget from "../ai/AIChatWidget";
import NotificationToast from "../ui/NotificationToast";
import { usePlatform } from "../../hooks/usePlatform";
import { useAuthStore } from "../../store/authStore";
import { signOut } from "../../utils/supabase";
import HelpLinks from "./HelpLinks";

/**
 * Wraps every authenticated page. Uses top navbar for desktop
 * and top bar + bottom navigation for mobile. Owns the single AOS
 * instance used by authenticated routes.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { mode } = usePlatform();
  const { setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const refresh = () => {
      window.requestAnimationFrame(() => {
        AOS.refreshHard();
        window.requestAnimationFrame(() => AOS.refresh());
      });
    };
    refresh();
    window.addEventListener("resize", refresh);
    return () => window.removeEventListener("resize", refresh);
  }, []);

  useEffect(() => {
    const firstRefresh = window.setTimeout(() => AOS.refreshHard(), 0);
    const secondRefresh = window.setTimeout(() => AOS.refresh(), 80);
    return () => {
      window.clearTimeout(firstRefresh);
      window.clearTimeout(secondRefresh);
    };
  }, [mode, location.pathname]);

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    navigate("/auth");
  };

  if (mode === "mobile") {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <MobileTopBar onLogout={handleLogout} />
        <main className="flex-1">{children}</main>
        <HelpLinks />
        <div className="mobile-nav-spacer" />
        <MobileBottomNav onLogout={handleLogout} />
        <AIChatWidget />
        <NotificationToast />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <DesktopNavbar onLogout={handleLogout} />
      <main className="flex-1">{children}</main>
      <HelpLinks />
      <AIChatWidget />
      <NotificationToast />
    </div>
  );
}
