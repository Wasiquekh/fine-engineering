"use client";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  route: string;
  createdAt: string;
  read: boolean;
  rawData?: Record<string, string>;
};

const STORAGE_KEY = "app_notifications_v1";
const EVENT_NAME = "app-notifications-updated";

const safeWindow = (): Window | null => (typeof window !== "undefined" ? window : null);

const emitUpdate = (): void => {
  const w = safeWindow();
  if (!w) return;
  w.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const notificationsEventName = EVENT_NAME;

export const getNotifications = (): AppNotification[] => {
  const w = safeWindow();
  if (!w) return [];
  try {
    const raw = w.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as AppNotification[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const setNotifications = (items: AppNotification[]): void => {
  const w = safeWindow();
  if (!w) return;
  w.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, 100)));
  emitUpdate();
};

export const addNotification = (item: Omit<AppNotification, "id" | "createdAt" | "read">): void => {
  const list = getNotifications();
  const newItem: AppNotification = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false,
    ...item,
  };
  setNotifications([newItem, ...list]);
};

export const markNotificationRead = (id: string): void => {
  const list = getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
  setNotifications(list);
};

export const markAllNotificationsRead = (): void => {
  const list = getNotifications().map((n) => ({ ...n, read: true }));
  setNotifications(list);
};

export const getUnreadNotificationCount = (): number => {
  return getNotifications().filter((n) => !n.read).length;
};

