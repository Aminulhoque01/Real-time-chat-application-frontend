
import {
  getToken,
} from "firebase/messaging";

import {
  getFirebaseMessaging,
} from "./firebase";

export const requestNotificationPermission =
  async (): Promise<string | null> => {
    try {
      // ==========================================
      // BROWSER CHECK
      // ==========================================

      if (
        typeof window ===
        "undefined"
      ) {
        return null;
      }

      if (
        !("Notification" in window)
      ) {
        console.error(
          "❌ Browser Notification API is not supported",
        );

        return null;
      }

      // ==========================================
      // CURRENT PERMISSION
      // ==========================================

      console.log(
        "🔔 Current notification permission:",
        Notification.permission,
      );

      let permission =
        Notification.permission;

      // ==========================================
      // REQUEST PERMISSION
      // ==========================================

      if (
        permission !== "granted"
      ) {
        permission =
          await Notification.requestPermission();
      }

      console.log(
        "🔔 Notification permission after request:",
        permission,
      );

      // ==========================================
      // PERMISSION CHECK
      // ==========================================

      if (
        permission !== "granted"
      ) {
        console.error(
          "❌ Notification permission was not granted",
        );

        return null;
      }

      // ==========================================
      // REGISTER SERVICE WORKER
      // ==========================================

      const serviceWorkerRegistration =
        await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js",
        );

      console.log(
        "✅ Firebase Service Worker registered:",
        serviceWorkerRegistration,
      );

      // ==========================================
      // GET FIREBASE MESSAGING
      // ==========================================

      const messaging =
        await getFirebaseMessaging();

      if (!messaging) {
        console.error(
          "❌ Firebase Messaging is not available",
        );

        return null;
      }

      // ==========================================
      // VAPID KEY
      // ==========================================

      const vapidKey =
        process.env
          .NEXT_PUBLIC_FIREBASE_VAPID_KEY;

      if (!vapidKey) {
        console.error(
          "❌ NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing",
        );

        return null;
      }

      // ==========================================
      // GET FCM TOKEN
      // ==========================================

      const token =
        await getToken(
          messaging,
          {
            vapidKey,
            serviceWorkerRegistration,
          },
        );

      if (!token) {
        console.error(
          "❌ FCM token was not generated",
        );

        return null;
      }

      console.log(
        "✅ FCM Token generated:",
        token,
      );

      return token;
    } catch (error) {
      console.error(
        "❌ FCM token error:",
        error,
      );

      return null;
    }
  };
 
