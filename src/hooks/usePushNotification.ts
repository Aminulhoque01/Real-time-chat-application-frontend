 
"use client";

import { useEffect } from "react";

import { requestNotificationPermission } from "@/src/lib/firebase-messaging";

import { useRegisterPushTokenMutation } from "@/src/redux/features/message/messageApi";

interface UsePushNotificationProps {
  userId?: string;
}

export const usePushNotification = ({
  userId,
}: UsePushNotificationProps) => {
  const [
    registerPushToken,
    { isLoading },
  ] = useRegisterPushTokenMutation();

  useEffect(() => {
    if (!userId) {
      console.log(
        "⏳ Push notification waiting for userId...",
      );

      return;
    }

    let cancelled = false;

    const registerToken = async () => {
      try {
        // ==========================================
        // REQUEST BROWSER NOTIFICATION PERMISSION
        // ==========================================

        const token =
          await requestNotificationPermission();

        if (!token || cancelled) {
          console.log(
            "❌ FCM token unavailable",
          );

          return;
        }

        // ==========================================
        // REGISTER FCM TOKEN TO BACKEND
        // ==========================================

        await registerPushToken({
          token,
          device: "web",
        }).unwrap();

        console.log(
          "✅ Push token registered successfully",
        );
      } catch (error) {
        console.error(
          "❌ Failed to register push token:",
          error,
        );
      }
    };

    registerToken();

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    registerPushToken,
  ]);

  return {
    isLoading,
  };
};
 
