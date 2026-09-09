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
  isTyping?: boolean;
}

const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
): ConversationUser | null => {
  if (conversation.type !== "direct") {
    return null;
  }

  return (
    conversation.participants.find(
      (participant) => participant._id !== currentUserId,
    ) ?? null
  );
};

const getConversationName = (
  conversation: Conversation,
  currentUserId?: string,
): string => {
  if (conversation.type === "group") {
    return conversation.name || "Group";
  }

  const otherUser = getOtherParticipant(
    conversation,
    currentUserId,
  );

  return otherUser?.name || otherUser?.phone || "Unknown";
};

const getConversationAvatar = (
  conversation: Conversation,
  currentUserId?: string,
): string | null => {
  if (conversation.type === "group") {
    return null;
  }

  const otherUser = getOtherParticipant(
    conversation,
    currentUserId,
  );

  return otherUser?.avatar || null;
};

export default function ChatUI({
  conversation,
  currentUserId,
  onOpenSidebar,
  onSendMessage,
  isTyping = false,
}: ChatUIProps) {
  /*
   * No conversation selected
   */
  if (!conversation) {
    return (
      <main className="flex min-h-0 flex-1 flex-col bg-white">
        <EmptyChat />
      </main>
    );
  }

  const otherUser = getOtherParticipant(
    conversation,
    currentUserId,
  );

  const name = getConversationName(
    conversation,
    currentUserId,
  );

  const avatar = getConversationAvatar(
    conversation,
    currentUserId,
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Header */}
      <ChatHeader
        conversation={conversation}
        name={name}
        avatar={avatar}
        otherUser={otherUser}
        onOpenSidebar={onOpenSidebar}
      />

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList
          conversationId={conversation._id}
        />
      </div>

      {/* Typing indicator */}
      <div className="min-h-[32px] shrink-0">
        {isTyping && <TypingIndicator />}
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={onSendMessage}
      />

      
    </main>
  );
}