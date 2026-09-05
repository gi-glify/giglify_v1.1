export type AppNotification = {
    id: string;
    title: string;
    detail: string;
    read: boolean;
    createdAt: string;
};
export declare const NOTIFICATION_EVENT = "giglify:notification";
export declare function fetchNotifications(userId: string, limit?: number): Promise<AppNotification[]>;
export declare function createNotification(userId: string, title: string, detail: string): Promise<AppNotification>;
export declare function markNotificationRead(id: string): Promise<void>;
export declare function formatNotificationTime(value: string): string;
//# sourceMappingURL=notifications.d.ts.map