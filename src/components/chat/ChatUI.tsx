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

  // Read / Seen
  markMessageAsRead?: (
    messageId: string,
  ) => void;

  

  isTyping?: boolean;
  typingUserName?: string;
}

const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
): ConversationUser | null => {
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

const getConversationName = (
  conversation: Conversation,
  currentUserId?: string,
): string => {
  if (conversation.type === "group") {
    return conversation.name?.trim() || "Group";
  }

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

const getConversationAvatar = (
  conversation: Conversation,
  currentUserId?: string,
): string | null => {
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



export default function ChatUI({
  conversation,
  currentUserId,
  onOpenSidebar,
  onSendMessage,
  onTypingStart,
  onTypingStop,
  markMessageAsRead,
  isTyping = false,
  typingUserName,
}: ChatUIProps) {
    console.log(
    "CHAT UI markMessageAsRead:",
    markMessageAsRead,
  );
  if (!conversation) {
    return (
      <main className="flex min-h-0 flex-1 flex-col bg-white">
        <EmptyChat />
      </main>
    );
  }

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

  const displayTypingName =
    typingUserName?.trim() || "Someone";

  return (
    <main className="flex min-h-0 flex-1 flex-col bg-white">
      <ChatHeader
        conversation={conversation}
        name={conversationName}
        avatar={conversationAvatar}
        otherUser={otherUser}
        onOpenSidebar={onOpenSidebar}
      />
      
      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList
        
          conversationId={conversation._id}
          currentUserId={currentUserId}
          markMessageAsRead={
            markMessageAsRead
          }
        />
        
      </div>

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

      <MessageComposer
        onSend={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </main>
  );
}