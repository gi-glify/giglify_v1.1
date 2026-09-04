import { useEffect, useState } from "react";
const STORAGE_KEY = "giglify_platform_override";
const BREAKPOINT = 768; // matches Tailwind's `md`
function detectMode() {
    if (typeof window === "undefined")
        return "desktop";
    return window.innerWidth < BREAKPOINT ? "mobile" : "desktop";
}
function getSavedOverride() {
    if (typeof window === "undefined")
        return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "desktop" || saved === "mobile" ? saved : null;
}
/**
 * Detects whether the UI should render the desktop shell (top navbar +
 * side drawer) or the mobile shell (bottom tab bar). Auto-detects from
 * viewport width, but the user can force either mode (e.g. "request
 * desktop site") and that choice is remembered.
 */
export function usePlatform() {
    const [auto, setAuto] = useState(detectMode);
    const [override, setOverrideState] = useState(getSavedOverride);
    useEffect(() => {
        const onResize = () => setAuto(detectMode());
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);
    const setOverride = (mode) => {
        setOverrideState(mode);
        if (mode) {
            localStorage.setItem(STORAGE_KEY, mode);
        }
        else {
            localStorage.removeItem(STORAGE_KEY);
        }
    };
    return {
        mode: override ?? auto,
        isAutoDetected: override === null,
        setOverride,
    };
}
//# sourceMappingURL=usePlatform.js.map