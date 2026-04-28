"use client";

import { useEffect, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import StorageManager from "../../provider/StorageManager";
import AxiosProvider from "../../provider/AxiosProvider";
import { getPushMessaging } from "../push/firebaseMessaging";
import {
  isLikelyValidVapidKey,
  pushFirebaseVapidKey,
  pushFirebaseWebConfig,
} from "../firebase-config";
import { addNotification, hydrateNotificationsFromQueue } from "../services/notificationCenter";

const storage = new StorageManager();
const api = new AxiosProvider();

const PUSH_REGISTERED_TOKEN_KEY = "push_registered_fcm_token";

export default function PushNotificationBootstrap() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        await hydrateNotificationsFromQueue();

        if ("serviceWorker" in navigator) {
          const swQuery = new URLSearchParams({
            apiKey: pushFirebaseWebConfig.apiKey || "",
            authDomain: pushFirebaseWebConfig.authDomain || "",
            projectId: pushFirebaseWebConfig.projectId || "",
            messagingSenderId: pushFirebaseWebConfig.messagingSenderId || "",
            appId: pushFirebaseWebConfig.appId || "",
          });
          await navigator.serviceWorker.register(`/firebase-messaging-sw.js?${swQuery.toString()}`);
        }

        const messaging = await getPushMessaging();
        if (!messaging) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const vapidKey = pushFirebaseVapidKey;
        if (!vapidKey) {
          console.warn(
            "VAPID key missing. Set NEXT_PUBLIC_PUSH_FIREBASE_VAPID_KEY (or NEXT_PUBLIC_FIREBASE_VAPID_KEY)"
          );
          return;
        }
        if (!isLikelyValidVapidKey(vapidKey)) {
          console.warn(
            "VAPID key format invalid. Copy exact PUBLIC key from Firebase > Project settings > Cloud Messaging > Web Push certificates."
          );
          return;
        }

        const readyRegistration =
          "serviceWorker" in navigator ? await navigator.serviceWorker.ready : undefined;
        const fcmToken = await getToken(messaging, {
          vapidKey,
          ...(readyRegistration ? { serviceWorkerRegistration: readyRegistration } : {}),
        });
        if (!fcmToken) return;

        const already = localStorage.getItem(PUSH_REGISTERED_TOKEN_KEY);
        if (already !== fcmToken) {
          const workerToken = storage.getWorkerToken();
          const workerData = storage.getWorkerData();
          const accessToken = storage.getAccessToken();

          if (workerToken && workerData?.worker_name) {
            await api.post("/fineengg_erp/worker/worker/push/register-token", {
              fcm_token: fcmToken,
              worker_name: workerData.worker_name,
              push_topic: workerData.push_topic || null,
              device_type: "web",
            });
          } else if (accessToken) {
            await api.post("/fineengg_erp/system/push/register-token", {
              fcm_token: fcmToken,
              user_name: storage.getUserName() || "System User",
              device_type: "web",
            });
          }

          localStorage.setItem(PUSH_REGISTERED_TOKEN_KEY, fcmToken);
        }

        onMessage(messaging, (payload) => {
          const title = payload?.notification?.title || "New Notification";
          const body = payload?.notification?.body || "";
          const data = (payload?.data || {}) as Record<string, string>;
          const route =
            data.route ||
            (data.source === "production_planning_job_assign"
              ? "/section_production_planning/production_planning"
              : "/material-movement");

          addNotification({
            title,
            body,
            route,
            rawData: data,
          });

          if (body) {
            toast.info(`${title}: ${body}`);
          } else {
            toast.info(title);
          }
        });

        // Handle service-worker forwarded background notifications
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.addEventListener("message", (event: MessageEvent) => {
            const messageType = event?.data?.type;
            if (messageType !== "PUSH_NOTIFICATION") return;

            const p = event?.data?.payload || {};
            const title = p?.title || "New Notification";
            const body = p?.body || "";
            const data = (p?.data || {}) as Record<string, string>;
            const route =
              data.route ||
              (data.source === "production_planning_job_assign"
                ? "/section_production_planning/production_planning"
                : "/material-movement");

            addNotification({
              title,
              body,
              route,
              rawData: data,
            });
          });
        }
      } catch (error) {
        console.error("PushNotificationBootstrap init failed:", error);
      }
    };

    init();
  }, []);

  return null;
}

