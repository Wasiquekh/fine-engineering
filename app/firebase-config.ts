import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

const firebaseConfig = {
  apiKey: "AIzaSyC9Emd8kxtNvI3MQyI37o97TRVp3lWsv3Y",
  authDomain: "fine-engineering-10667.firebaseapp.com",
  projectId: "fine-engineering-10667",
  storageBucket: "fine-engineering-10667.firebasestorage.app",
  messagingSenderId: "704890782981",
  appId: "1:704890782981:web:91cbf26633ba7d641b636c",
  measurementId: "G-MBP0STH3SG",
};

const rawVapidKey =
  process.env.NEXT_PUBLIC_PUSH_FIREBASE_VAPID_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  "";

export const pushFirebaseVapidKey = rawVapidKey.replace(/\s+/g, "").trim();

export const isLikelyValidVapidKey = (key: string): boolean => {
  if (!key) return false;
  if (!/^[A-Za-z0-9_-]+$/.test(key)) return false;
  return key.length >= 80 && key.length <= 120;
};

const app = initializeApp(firebaseConfig);

export const appCheck = (() => {
  if (typeof window !== "undefined") {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY;
    if (!siteKey) return null;
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  return null;
})();

export const analytics = (() => {
  if (typeof window !== "undefined") {
    return getAnalytics(app);
  }
  return null;
})();

export const pushFirebaseWebConfig = firebaseConfig;
export { app };