export type PlatformMode = 'desktop' | 'mobile';
/**
 * Detects whether the UI should render the desktop shell (top navbar +
 * side drawer) or the mobile shell (bottom tab bar). Auto-detects from
 * viewport width, but the user can force either mode (e.g. "request
 * desktop site") and that choice is remembered.
 */
export declare function usePlatform(): {
    mode: PlatformMode;
    isAutoDetected: boolean;
    setOverride: (mode: PlatformMode | null) => void;
};
//# sourceMappingURL=usePlatform.d.ts.map