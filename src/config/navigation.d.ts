import type { LucideIcon } from 'lucide-react';
export interface NavItem {
    label: string;
    path: string;
    icon: LucideIcon;
    /** shown in the mobile bottom bar (keep this list to 4-5 items) */
    primary?: boolean;
}
export declare const NAV_ITEMS: NavItem[];
export declare const PRIMARY_NAV_ITEMS: NavItem[];
//# sourceMappingURL=navigation.d.ts.map