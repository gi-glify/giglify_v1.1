export const LAST_ROUTE_KEY = 'giglify:last-route';
export function isRestorableRoute(pathname) {
    return pathname === '/dashboard' ||
        pathname === '/tasks' ||
        pathname.startsWith('/tasks/') ||
        pathname === '/verify' ||
        pathname === '/deposit' ||
        pathname === '/financials' ||
        pathname === '/profile' ||
        pathname === '/notifications' ||
        pathname === '/settings';
}
export function getLastRoute() {
    const route = localStorage.getItem(LAST_ROUTE_KEY);
    return route && isRestorableRoute(route) ? route : null;
}
export function rememberRoute(pathname) {
    if (isRestorableRoute(pathname)) {
        localStorage.setItem(LAST_ROUTE_KEY, pathname);
    }
}
//# sourceMappingURL=routeMemory.js.map