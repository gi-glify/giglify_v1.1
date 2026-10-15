import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AOS from "aos";
import DesktopNavbar from "./DesktopNavbar";
import { MobileTopBar, MobileBottomNav } from "./MobileShell";
import AIChatWidget from "../ai/AIChatWidget";
import NotificationToast from "../ui/NotificationToast";
import { usePlatform } from "../../hooks/usePlatform";
import { useAuthStore } from "../../store/authStore";
import { signOut, supabase } from "../../utils/supabase";
import HelpLinks from "./HelpLinks";
import { fetchPackageCatalog } from "../../lib/paymentsApi";
import { fetchNotifications, NOTIFICATION_EVENT } from "../../lib/notifications";

/**
 * Wraps every authenticated page. Uses top navbar for desktop
 * and top bar + bottom navigation for mobile. Owns the single AOS
 * instance used by authenticated routes.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { mode } = usePlatform();
  const user = useAuthStore((state) => state.user);
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

  // Refresh the wallet when the user returns from an admin review or payment flow.
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const refreshWallet = async () => {
      const { data, error } = await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle();
      if (!active || error || !data) return;
      const current = useAuthStore.getState().user;
      const balance = Number(data.balance ?? 0);
      if (current?.id === user.id && current.balance !== balance) setUser({ ...current, balance });
    };
    void refreshWallet();
    window.addEventListener("focus", refreshWallet);
    return () => {
      active = false;
      window.removeEventListener("focus", refreshWallet);
    };
  }, [location.pathname, setUser, user?.id]);

  // The catalog call also creates the idempotent 24-hour package-expiry warning.
  // Refresh the navbar feed after it is created so the warning is visible now.
  useEffect(() => {
    if (!user?.id) return;
    void fetchPackageCatalog().then((catalog) => {
      if (!catalog.expiryWarning) return;
      return fetchNotifications(user.id, 5).then((items) => {
        const warning = items.find((item) => item.title === "Package expires in 24 hours");
        if (warning) window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: warning }));
      });
    }).catch(() => {
      // Package status remains available from the dashboard even if the catalog is unavailable.
    });
  }, [user?.id]);

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
