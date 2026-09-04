import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { getDeviceInfo, isDesktopEligible, isMobileOptimized } from '../utils/deviceDetection';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
export default function VerifyPage() {
    const { theme } = useTheme();
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [desktopEligible, setDesktopEligible] = useState(false);
    const [mobileOptimized, setMobileOptimized] = useState(false);
    useEffect(() => {
        const checkDevice = async () => {
            try {
                const info = await getDeviceInfo();
                setDeviceInfo(info);
                setDesktopEligible(isDesktopEligible(info));
                setMobileOptimized(isMobileOptimized(info));
            }
            finally {
                setLoading(false);
            }
        };
        checkDevice();
    }, []);
    return (_jsxs("div", { className: "min-h-screen transition-colors", style: { background: 'var(--bg)', color: 'var(--text)' }, children: [_jsx("div", { className: "container pt-8", children: _jsx("h1", { className: "font-display text-2xl font-bold", "data-aos": "fade-down", children: "Device Verification" }) }), _jsx("main", { className: "container py-8", children: loading ? (_jsx("div", { className: "flex justify-center items-center h-96", children: _jsx("div", { className: "spinner" }) })) : deviceInfo ? (_jsxs("div", { className: "max-w-2xl mx-auto", children: [_jsxs("div", { className: `card mb-8 animate-in ${theme === 'dark' ? 'bg-stone-800 border-stone-700' : ''}`, children: [_jsx("h2", { className: "font-display text-2xl mb-4", children: "System Analysis" }), _jsxs("div", { className: "grid grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("h3", { className: `text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: "Hardware" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: "CPU Cores" }), _jsx("p", { className: theme === 'dark' ? 'text-stone-400' : 'text-stone-600', children: deviceInfo.cpuCores })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: "Screen Resolution" }), _jsxs("p", { className: theme === 'dark' ? 'text-stone-400' : 'text-stone-600', children: [deviceInfo.screenWidth, " \u00D7 ", deviceInfo.screenHeight] })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: "Connection" }), _jsx("p", { className: theme === 'dark' ? 'text-stone-400' : 'text-stone-600', children: deviceInfo.connectionSpeed.charAt(0).toUpperCase() + deviceInfo.connectionSpeed.slice(1) })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: `text-sm font-semibold mb-4 ${theme === 'dark' ? 'text-stone-400' : 'text-stone-600'}`, children: "Software" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: "Operating System" }), _jsx("p", { className: theme === 'dark' ? 'text-stone-400' : 'text-stone-600', children: deviceInfo.os })] }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-semibold", children: "Browser" }), _jsx("p", { className: theme === 'dark' ? 'text-stone-400' : 'text-stone-600', children: deviceInfo.browser })] })] })] })] })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-4", children: [_jsx("div", { className: `card animate-in ${desktopEligible ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [desktopEligible ? (_jsx(CheckCircle2, { className: "text-green-600 flex-shrink-0 mt-1", size: 24 })) : (_jsx(AlertCircle, { className: "text-red-600 flex-shrink-0 mt-1", size: 24 })), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-1", children: "Desktop Tasks" }), _jsx("p", { className: "text-sm", children: desktopEligible
                                                            ? 'Your device meets requirements for advanced desktop tasks.'
                                                            : 'Upgrade to unlock high-performance desktop tasks.' })] })] }) }), _jsx("div", { className: `card animate-in ${mobileOptimized ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`, children: _jsxs("div", { className: "flex items-start gap-3", children: [mobileOptimized ? (_jsx(CheckCircle2, { className: "text-green-600 flex-shrink-0 mt-1", size: 24 })) : (_jsx(AlertCircle, { className: "text-orange-600 flex-shrink-0 mt-1", size: 24 })), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-1", children: "Mobile Tasks" }), _jsx("p", { className: "text-sm", children: mobileOptimized
                                                            ? 'You can access mobile-optimized micro-tasks.'
                                                            : 'Desktop device. Mobile tasks unavailable.' })] })] }) })] })] })) : null })] }));
}
//# sourceMappingURL=Verify.js.map