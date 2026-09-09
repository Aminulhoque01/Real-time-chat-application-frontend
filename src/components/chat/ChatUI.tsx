"use client";

import ChatHeader from "./ChatHeader";
import MessageComposer from "./MessageComposer";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import EmptyChat from "./EmptyChat";

import type {
  Conversation,
  ConversationUser,
} from "@/src/redux/features/conversation/conversation.types";

interface ChatUIProps {
  conversation: Conversation | null;
  currentUserId?: string;

  onOpenSidebar: () => void;

  onSendMessage?: (message: string) => void;

  onTypingStart?: () => void;
  onTypingStop?: () => void;

  isTyping?: boolean;
  typingUserName?: string;
}

// ======================================================
// GET OTHER PARTICIPANT
// ======================================================

const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
): ConversationUser | null => {
  // Group conversation হলে single "other user" থাকবে না
  if (conversation.type === "group") {
    return null;
  }

  const otherParticipant =
    conversation.participants.find(
      (participant) =>
        participant._id !== currentUserId,
    );

  return otherParticipant ?? null;
};

// ======================================================
// GET CONVERSATION NAME
// ======================================================

const getConversationName = (
  conversation: Conversation,
  currentUserId?: string,
): string => {
  // Group name
  if (conversation.type === "group") {
    return conversation.name?.trim() || "Group";
  }

  // Direct chat → other person's name
  const otherUser =
    getOtherParticipant(
      conversation,
      currentUserId,
    );

  return (
    otherUser?.name?.trim() ||
    otherUser?.phone ||
    "Unknown"
  );
};

// ======================================================
// GET CONVERSATION AVATAR
// ======================================================

const getConversationAvatar = (
  conversation: Conversation,
  currentUserId?: string,
): string | null => {
  // Group chat
  if (conversation.type === "group") {
    return null;
  }

  const otherUser =
    getOtherParticipant(
      conversation,
      currentUserId,
    );

  return otherUser?.avatar || null;
};

// ======================================================
// CHAT UI
// ======================================================

export default function ChatUI({
  conversation,
  currentUserId,
  onOpenSidebar,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  isTyping = false,
  typingUserName,
}: ChatUIProps) {
  // ====================================================
  // NO CONVERSATION SELECTED
  // ====================================================

  if (!conversation) {
    return (
      <main className="flex min-h-0 flex-1 flex-col bg-white">
        <EmptyChat />
      </main>
    );
  }

  // ====================================================
  // CONVERSATION INFORMATION
  // ====================================================

  const otherUser =
    getOtherParticipant(
      conversation,
      currentUserId,
    );

  const conversationName =
    getConversationName(
      conversation,
      currentUserId,
    );

  const conversationAvatar =
    getConversationAvatar(
      conversation,
      currentUserId,
    );

  // ====================================================
  // TYPING NAME
  // ====================================================

  const displayTypingName =
    typingUserName?.trim() || "Someone";

  // ====================================================
  // UI
  // ====================================================

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white">
      {/* ==================================================
          CHAT HEADER
      ================================================== */}

      <ChatHeader
        conversation={conversation}
        name={conversationName}
        avatar={conversationAvatar}
        otherUser={otherUser}
        onOpenSidebar={onOpenSidebar}
      />

      {/* ==================================================
          MESSAGE AREA
      ================================================== */}

      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList
          conversationId={conversation._id}
        />
      </div>

      {/* ==================================================
          TYPING INDICATOR
      ================================================== */}

      <div
        className={`
          min-h-[32px]
          shrink-0
          transition-all
          duration-200
          ${
            isTyping
              ? "opacity-100"
              : "opacity-0"
          }
        `}
      >
        {isTyping && (
          <TypingIndicator
            name={displayTypingName}
          />
        )}
      </div>

      {/* ==================================================
          MESSAGE COMPOSER
      ================================================== */}

      <MessageComposer
        onSend={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </main>
  );
}