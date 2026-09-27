import {
  getApps,
  initializeApp,
} from "firebase/app";

import {
  getMessaging,
  isSupported,
  Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY,

  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,

  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,

  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,

  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,

  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseApp =
  getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

export const getFirebaseMessaging =
  async (): Promise<Messaging | null> => {
    if (typeof window === "undefined") {
      return null;
    }

    const supported = await isSupported();

    if (!supported) {
      console.warn(
        "Firebase Messaging is not supported in this browser.",
      );

      return null;
    }

    return getMessaging(firebaseApp);
  };