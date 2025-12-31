import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBW28crGu2Y3mLan4T5WI1D4IAVbiYTK3k",
  authDomain: "orizon-mobile-dev.firebaseapp.com",
  projectId: "orizon-mobile-dev",
  storageBucket: "orizon-mobile-dev.appspot.com",
  messagingSenderId: "671207924673",
  appId: "1:671207924673:web:7e6e14cd8fdef5294a0540",
  measurementId: "G-110CJEPPMR",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize App Check
export const appCheck = (() => {
  if (typeof window !== "undefined") {
    return initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider("6LeNlSAqAAAAAGbgvmjfMsR2zwWpGCFL4RqDg9uE"),
      isTokenAutoRefreshEnabled: true,
    });
  }
  return null;
})();

// Initialize Analytics
export const analytics = (() => {
  if (typeof window !== "undefined") {
    return getAnalytics(app);
  }
  return null;
})();
export { app, };
