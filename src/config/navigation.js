import { Home, ListChecks, Wallet, Bell, User, Settings } from 'lucide-react';
export const NAV_ITEMS = [
    { label: 'Home', path: '/dashboard', icon: Home, primary: true },
    { label: 'Tasks', path: '/tasks', icon: ListChecks, primary: true },
    { label: 'Wallet', path: '/financials', icon: Wallet, primary: true },
    { label: 'Notifications', path: '/notifications', icon: Bell, primary: true },
    { label: 'Profile', path: '/profile', icon: User, primary: true },
    { label: 'Settings', path: '/settings', icon: Settings },
];
export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((n) => n.primary);
//# sourceMappingURL=navigation.js.map