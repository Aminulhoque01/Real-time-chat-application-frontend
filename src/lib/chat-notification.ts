 
"use client";

export interface ChatNotificationData {
  title: string;
  body: string;
  conversationId: string;
  messageId: string;
  senderId?: string | null;
}

const CHAT_NOTIFICATION_EVENT =
  "chat:notification";

export const emitChatNotification = (
  data: ChatNotificationData,
) => {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<ChatNotificationData>(
      CHAT_NOTIFICATION_EVENT,
      {
        detail: data,
      },
    ),
  );
};

export const CHAT_NOTIFICATION_EVENT_NAME =
  CHAT_NOTIFICATION_EVENT;
 
