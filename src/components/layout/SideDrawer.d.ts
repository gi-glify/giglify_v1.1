interface SideDrawerProps {
    open: boolean;
    onClose: () => void;
    onLogout: () => void;
    /** 'push' for the permanent desktop rail, 'overlay' for the mobile drawer */
    variant?: 'push' | 'overlay';
}
export default function SideDrawer({ open, onClose, onLogout, variant }: SideDrawerProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SideDrawer.d.ts.map