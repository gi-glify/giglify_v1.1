const SITE_URL = 'https://giglify.co.ke';
let lastTrackedPath = null;
export function trackPageView(pathname) {
    if (typeof window === 'undefined' || !window.gtag || pathname === lastTrackedPath)
        return;
    lastTrackedPath = pathname;
    window.gtag('event', 'page_view', {
        page_path: pathname,
        page_location: `${SITE_URL}${pathname}`,
    });
}
//# sourceMappingURL=analytics.js.map