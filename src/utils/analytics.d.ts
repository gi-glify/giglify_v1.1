declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}
export declare function trackPageView(pathname: string): void;
//# sourceMappingURL=analytics.d.ts.map