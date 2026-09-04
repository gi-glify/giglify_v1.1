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
export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
        <MobileTopBar onOpenDrawer={() => setMobileDrawerOpen(true)} />
        <SideDrawer variant="overlay" open={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} onLogout={handleLogout} />
        <main className="flex-1">{children}</main>
        <div className="mobile-nav-spacer" />
        <MobileBottomNav />
        <AIChatWidget />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SideDrawer variant="push" open={drawerOpen} onClose={() => setDrawerOpen(false)} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col min-w-0">
        <DesktopNavbar onToggleDrawer={() => setDrawerOpen((v) => !v)} />
        <main className="flex-1">{children}</main>
      </div>
      <AIChatWidget />
    </div>
  );
}
