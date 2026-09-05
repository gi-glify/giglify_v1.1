import { supabase } from '../utils/supabase';

export type AppNotification = {
  id: string;
  title: string;
  detail: string;
  read: boolean;
  createdAt: string;
};

export const NOTIFICATION_EVENT = 'giglify:notification';

function mapNotification(row: { id: string; title: string; detail: string | null; read: boolean; created_at: string }): AppNotification {
  return { id: row.id, title: row.title, detail: row.detail || '', read: row.read, createdAt: row.created_at };
}

export async function fetchNotifications(userId: string, limit = 20) {
  const { data, error } = await supabase.from('notifications').select('id, title, detail, read, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function createNotification(userId: string, title: string, detail: string) {
  const { data, error } = await supabase.from('notifications').insert({ user_id: userId, title, detail }).select('id, title, detail, read, created_at').single();
  if (error) throw error;
  const notification = mapNotification(data);
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: notification }));
  return notification;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export function formatNotificationTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return date.toLocaleDateString();
}
