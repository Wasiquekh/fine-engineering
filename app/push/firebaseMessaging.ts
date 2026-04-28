"use client";

import { getMessaging, isSupported, Messaging } from "firebase/messaging";
import { app } from "../firebase-config";

export const getPushMessaging = async (): Promise<Messaging | null> => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(app);
};

