 
"use client";

// ==========================================
// CHAT NOTIFICATION DATA
// ==========================================

export interface ChatNotificationData {
  title: string;

  body: string;

  conversationId: string;

  messageId: string;

  senderId?: string | null;

  senderAvatar?: string | null;
}

// ==========================================
// EVENT NAME
// ==========================================

const CHAT_NOTIFICATION_EVENT =
  "chat:notification";

// ==========================================
// EMIT CHAT NOTIFICATION
// ==========================================

export const emitChatNotification = (
  data: ChatNotificationData,
) => {
  if (
    typeof window ===
    "undefined"
  ) {
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

// ==========================================
// EVENT NAME EXPORT
// ==========================================

export const CHAT_NOTIFICATION_EVENT_NAME =
  CHAT_NOTIFICATION_EVENT;
 
