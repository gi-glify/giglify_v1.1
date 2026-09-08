import { Home, ListChecks, Wallet, Bell, User, Settings, Info, ShieldCheck, ClipboardCheck } from 'lucide-react';
export const NAV_ITEMS = [
    { label: 'Home', path: '/dashboard', icon: Home, primary: true },
    { label: 'Tasks', path: '/tasks', icon: ListChecks, primary: true },
    { label: 'Wallet', path: '/financials', icon: Wallet, primary: true },
    { label: 'Notifications', path: '/notifications', icon: Bell, primary: true },
    { label: 'Profile', path: '/profile', icon: User, primary: true },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'About & Policies', path: '/about', icon: Info },
    { label: 'Requester KYC', path: '/requester/apply', icon: ShieldCheck },
    { label: 'Post a Task', path: '/requester/tasks', icon: ClipboardCheck },
];
export const PRIMARY_NAV_ITEMS = NAV_ITEMS.filter((n) => n.primary);
//# sourceMappingURL=navigation.js.map