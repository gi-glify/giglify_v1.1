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
export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <MobileTopBar onLogout={handleLogout} />
        <main className="flex-1">{children}</main>
        <div className="mobile-nav-spacer" />
        <MobileBottomNav />
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
      <AIChatWidget />
      <NotificationToast />
    </div>
  );
}
