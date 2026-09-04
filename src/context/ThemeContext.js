import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState } from 'react';
const ThemeContext = createContext(undefined);
function applyThemeClass(theme) {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
}
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark')
            return saved;
        return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });
    useEffect(() => {
        applyThemeClass(theme);
    }, [theme]);
    const setTheme = (t) => {
        localStorage.setItem('theme', t);
        setThemeState(t);
    };
    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    return (_jsx(ThemeContext.Provider, { value: { theme, toggleTheme, setTheme }, children: children }));
}
export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx)
        throw new Error('useTheme must be used within a ThemeProvider');
    return ctx;
}
//# sourceMappingURL=ThemeContext.js.map