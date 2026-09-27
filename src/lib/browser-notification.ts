 
"use client";

interface ShowBrowserNotificationParams {
  title: string;

  body: string;

  conversationId?: string;

  messageId?: string;
}

export const showBrowserNotification =
  ({
    title,
    body,
    conversationId,
    messageId,
  }: ShowBrowserNotificationParams) => {
    try {
      // ==========================================
      // BROWSER CHECK
      // ==========================================

      if (
        typeof window ===
        "undefined"
      ) {
        return false;
      }

      // ==========================================
      // NOTIFICATION API CHECK
      // ==========================================

      if (
        !("Notification" in window)
      ) {
        console.error(
          "❌ Notification API unavailable",
        );

        return false;
      }

      // ==========================================
      // PERMISSION CHECK
      // ==========================================

      if (
        Notification.permission !==
        "granted"
      ) {
        console.warn(
          "⚠️ Notification permission:",
          Notification.permission,
        );

        return false;
      }

      // ==========================================
      // NOTIFICATION OPTIONS
      // ==========================================

      const options: NotificationOptions =
        {
          body,

          // যদি icon file থাকে তাহলে এটা রাখবে
          icon:
            "/icon-192x192.png",

          tag:
            messageId
              ? `chat-message-${messageId}`
              : `chat-${conversationId}`,

          data: {
            conversationId,
            messageId,
          },

          requireInteraction:
            false,
        };

      // ==========================================
      // SHOW NOTIFICATION
      // ==========================================

      const notification =
        new Notification(
          title,
          options,
        );

      console.log(
        "🔔 BROWSER NOTIFICATION CREATED:",
        {
          title,
          body,
          conversationId,
          messageId,
        },
      );

      // ==========================================
      // SHOW EVENT
      // ==========================================

      notification.onshow =
        () => {
          console.log(
            "✅ BROWSER NOTIFICATION SHOW EVENT FIRED",
          );
        };

      // ==========================================
      // ERROR EVENT
      // ==========================================

      notification.onerror =
        (event) => {
          console.error(
            "❌ BROWSER NOTIFICATION ERROR:",
            event,
          );
        };

      // ==========================================
      // CLICK
      // ==========================================

      notification.onclick =
        () => {
          console.log(
            "🔔 Notification clicked:",
            {
              conversationId,
              messageId,
            },
          );

          window.focus();

          notification.close();
        };

      return true;
    } catch (error) {
      console.error(
        "❌ Failed to create browser notification:",
        error,
      );

      return false;
    }
  };
 
