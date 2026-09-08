const SITE_URL = 'https://giglify.pages.dev';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

let lastTrackedPath: string | null = null;

export function trackPageView(pathname: string) {
  if (typeof window === 'undefined' || !window.gtag || pathname === lastTrackedPath) return;

  lastTrackedPath = pathname;
  window.gtag('event', 'page_view', {
    page_path: pathname,
    page_location: `${SITE_URL}${pathname}`,
  });
}
