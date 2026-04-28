/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

const swUrl = new URL(self.location.href);
const q = swUrl.searchParams;

const defaultFirebaseConfig = {
  apiKey: "AIzaSyC9Emd8kxtNvI3MQyI37o97TRVp3lWsv3Y",
  authDomain: "fine-engineering-10667.firebaseapp.com",
  projectId: "fine-engineering-10667",
  messagingSenderId: "704890782981",
  appId: "1:704890782981:web:91cbf26633ba7d641b636c",
};

const firebaseConfig = {
  apiKey: q.get("apiKey") || defaultFirebaseConfig.apiKey,
  authDomain: q.get("authDomain") || defaultFirebaseConfig.authDomain,
  projectId: q.get("projectId") || defaultFirebaseConfig.projectId,
  messagingSenderId: q.get("messagingSenderId") || defaultFirebaseConfig.messagingSenderId,
  appId: q.get("appId") || defaultFirebaseConfig.appId,
};

if (
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
) {
  firebase.initializeApp(firebaseConfig);

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const title = payload?.notification?.title || "New Assignment";
    const body = payload?.notification?.body || "";
    const data = payload?.data || {};
    const route =
      data?.route ||
      (data?.source === "production_planning_job_assign"
        ? "/section_production_planning/production_planning"
        : "/material-movement");

    self.registration.showNotification(title, {
      body,
      data: { ...data, route },
      icon: "/images/fine-engineering-icon.png",
    });

    // Broadcast to open tabs so in-app notification center can store it.
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({
          type: "PUSH_NOTIFICATION",
          payload: {
            title,
            body,
            data: { ...data, route },
          },
        });
      });
    });
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const route = event?.notification?.data?.route || "/material-movement";
  event.waitUntil(clients.openWindow(route));
});

