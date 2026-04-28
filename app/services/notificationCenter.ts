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
const DB_NAME = "fine_notifications_db";
const STORE_NAME = "queued_notifications";

const safeWindow = (): Window | null => (typeof window !== "undefined" ? window : null);

const emitUpdate = (): void => {
  const w = safeWindow();
  if (!w) return;
  w.dispatchEvent(new CustomEvent(EVENT_NAME));
};

export const notificationsEventName = EVENT_NAME;

const toStringRecord = (input: unknown): Record<string, string> => {
  if (!input || typeof input !== "object") return {};
  const output: Record<string, string> = {};
  Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
    output[String(key)] = String(value ?? "");
  });
  return output;
};

const buildFingerprint = (item: {
  title: string;
  body: string;
  route: string;
  rawData?: Record<string, string>;
}): string => {
  return JSON.stringify({
    title: item.title || "",
    body: item.body || "",
    route: item.route || "",
    rawData: toStringRecord(item.rawData || {}),
  });
};

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
  const incomingFingerprint = buildFingerprint(item);
  const duplicate = list.find(
    (n) => buildFingerprint(n) === incomingFingerprint
  );
  if (duplicate) {
    return;
  }
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

type QueuedNotification = {
  id: string;
  title?: string;
  body?: string;
  route?: string;
  rawData?: Record<string, unknown>;
  receivedAt?: string;
};

const openNotificationsDb = async (): Promise<IDBDatabase> => {
  return await new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const readQueuedNotifications = async (): Promise<QueuedNotification[]> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) return [];
  const db = await openNotificationsDb();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const items = await new Promise<QueuedNotification[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result || []) as QueuedNotification[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return items;
};

const clearQueuedNotifications = async (): Promise<void> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;
  const db = await openNotificationsDb();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
  db.close();
};

export const hydrateNotificationsFromQueue = async (): Promise<void> => {
  if (typeof window === "undefined" || !("indexedDB" in window)) return;

  try {
    const queued = await readQueuedNotifications();
    if (!queued.length) return;

    const existing = getNotifications();
    const existingFingerprints = new Set(existing.map((item) => buildFingerprint(item)));
    const merged = [...existing];

    queued
      .sort((a, b) => {
        const aTime = Date.parse(a.receivedAt || "") || 0;
        const bTime = Date.parse(b.receivedAt || "") || 0;
        return bTime - aTime;
      })
      .forEach((entry) => {
        const candidate: AppNotification = {
          id: String(entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
          title: String(entry.title || "New Notification"),
          body: String(entry.body || ""),
          route: String(entry.route || "/material-movement"),
          createdAt: String(entry.receivedAt || new Date().toISOString()),
          read: false,
          rawData: toStringRecord(entry.rawData || {}),
        };
        const fp = buildFingerprint(candidate);
        if (!existingFingerprints.has(fp)) {
          existingFingerprints.add(fp);
          merged.push(candidate);
        }
      });

    setNotifications(
      merged.sort(
        (a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "")
      )
    );
    await clearQueuedNotifications();
  } catch {
    // Keep notifications non-blocking if queue hydration fails.
  }
};

