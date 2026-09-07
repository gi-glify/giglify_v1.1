import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const transitionTimer = useRef<number | undefined>(undefined);
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    if (t === theme) return;
    document.documentElement.classList.add('theme-transition');
    window.clearTimeout(transitionTimer.current);
    transitionTimer.current = window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition');
    }, 360);
    localStorage.setItem('theme', t);
    setThemeState(t);
  };

  useEffect(() => () => window.clearTimeout(transitionTimer.current), []);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
