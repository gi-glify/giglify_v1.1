import { Moon, Sun, Monitor, Smartphone } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePlatform } from '../hooks/usePlatform';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { mode, isAutoDetected, setOverride } = usePlatform();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <main className="container py-8 max-w-xl">
        <h1 className="font-display text-2xl mb-6" data-aos="fade-down">Settings</h1>

        <div className="card mb-4" data-aos="fade-up">
          <h3 className="font-semibold mb-3">Appearance</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold ${
                theme === 'light' ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)]'
              }`}
            >
              <Sun size={16} /> Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold ${
                theme === 'dark' ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)]'
              }`}
            >
              <Moon size={16} /> Dark
            </button>
          </div>
        </div>

        <div className="card" data-aos="fade-up" data-aos-delay="80">
          <h3 className="font-semibold mb-1">Display mode</h3>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {isAutoDetected ? 'Currently auto-detected from your screen size.' : 'Manually overridden — resize won\'t change this.'}
          </p>
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => setOverride('desktop')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold ${
                mode === 'desktop' ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)]'
              }`}
            >
              <Monitor size={16} /> Desktop
            </button>
            <button
              onClick={() => setOverride('mobile')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-semibold ${
                mode === 'mobile' ? 'bg-brand-600 text-white border-brand-600' : 'border-[var(--border)]'
              }`}
            >
              <Smartphone size={16} /> Mobile
            </button>
          </div>
          {!isAutoDetected && (
            <button onClick={() => setOverride(null)} className="text-xs font-semibold hover:opacity-80">
              Reset to auto-detect
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
