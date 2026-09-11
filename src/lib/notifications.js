import { supabase } from '../utils/supabase';
export const NOTIFICATION_EVENT = 'giglify:notification';
function inferNotificationKind(title, detail) {
    const text = `${title} ${detail}`.toLowerCase();
    if (/(error|danger|failed|failure|rejected|rejected|blocked|critical)/.test(text))
        return 'danger';
    if (/(warning|attention|pending|review)/.test(text))
        return 'warning';
    if (/(success|approved|completed|updated|saved|verified)/.test(text))
        return 'success';
    return 'info';
}
function mapNotification(row) {
    const detail = row.detail || '';
    return { id: row.id, title: row.title, detail, read: row.read, createdAt: row.created_at, kind: inferNotificationKind(row.title, detail) };
}
export async function fetchNotifications(userId, limit = 20) {
    const { data, error } = await supabase.from('notifications').select('id, title, detail, read, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
    if (error)
        throw error;
    return (data || []).map(mapNotification);
}
export async function createNotification(userId, title, detail, kind) {
    const { data, error } = await supabase.from('notifications').insert({ user_id: userId, title, detail }).select('id, title, detail, read, created_at').single();
    if (error)
        throw error;
    const notification = { ...mapNotification(data), ...(kind ? { kind } : {}) };
    window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: notification }));
    return notification;
}
export async function markNotificationRead(id) {
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
    if (error)
        throw error;
}
export function formatNotificationTime(value) {
    const date = new Date(value);
    const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60)
        return 'Just now';
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
}
//# sourceMappingURL=notifications.js.map