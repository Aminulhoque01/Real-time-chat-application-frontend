"use client";

import { useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageComposer, {
  type MessageSendPayload,
} from "./MessageComposer";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import EmptyChat from "./EmptyChat";
 

import type {
  Conversation,
  ConversationUser,
} from "@/src/redux/features/conversation/conversation.types";

import type { Message } from "@/src/redux/features/message/message.types";
import GroupModal from "./GroupModal";

// ==================================================
// PROPS
// ==================================================

interface ChatUIProps {
  conversation: Conversation | null;

  currentUserId?: string;

  onOpenSidebar: () => void;

  // ==================================================
  // PROFILE
  // ==================================================

  onOpenProfile: () => void;

  // ==================================================
  // BLOCK
  // ==================================================

  isBlocked?: boolean;

  // ==================================================
  // SEND MESSAGE
  // ==================================================

  onSendMessage?: (
    payload: MessageSendPayload,
  ) => void;

  // ==================================================
  // REPLY
  // ==================================================

  replyingTo?: Message | null;

  onReplyMessage?: (
    message: Message,
  ) => void;

  onCancelReply?: () => void;

  // ==================================================
  // TYPING
  // ==================================================

  onTypingStart?: () => void;

  onTypingStop?: () => void;

  // ==================================================
  // READ
  // ==================================================

  markMessageAsRead?: (
    messageId: string,
  ) => void;

  // ==================================================
  // DELETE MESSAGE
  // ==================================================

  onDeleteMessage?: (
    messageId: string,
  ) => boolean;

  // ==================================================
  // EDIT MESSAGE
  // ==================================================

  onEditMessage?: (
    messageId: string,
    text: string,
  ) => boolean;

  // ==================================================
  // REACTION
  // ==================================================

  onReactionMessage?: (
    messageId: string,
    emoji: string,
  ) => boolean;

  // ==================================================
  // TYPING INDICATOR
  // ==================================================

  isTyping?: boolean;

  typingUserName?: string;

  // ==================================================
  // SEND LOADING
  // ==================================================

  isSending?: boolean;

  // ==================================================
  // OPTIONAL GROUP CALLBACK
  // ==================================================

  onGroupUpdated?: (
    conversation: Conversation,
  ) => void;

  onGroupDeleted?: (
    conversationId: string,
  ) => void;

  onGroupLeft?: () => void;
}

// ==================================================
// GET OTHER PARTICIPANT
// ==================================================

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
        String(participant._id) !==
        String(currentUserId),
    );

  return otherParticipant ?? null;
};

// ==================================================
// GET CONVERSATION NAME
// ==================================================

const getConversationName = (
  conversation: Conversation,
  currentUserId?: string,
): string => {
  if (conversation.type === "group") {
    return (
      conversation.name?.trim() ||
      "Group"
    );
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

// ==================================================
// GET CONVERSATION AVATAR
// ==================================================

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

// ==================================================
// CHAT UI
// ==================================================

export default function ChatUI({
  conversation,
  currentUserId,
  onOpenSidebar,
  onOpenProfile,

  // BLOCK
  isBlocked = false,

  // SEND
  onSendMessage,

  // REPLY
  replyingTo,
  onReplyMessage,
  onCancelReply,

  // TYPING
  onTypingStart,
  onTypingStop,

  // READ
  markMessageAsRead,

  // DELETE
  onDeleteMessage,

  // EDIT
  onEditMessage,

  // REACTION
  onReactionMessage,

  // TYPING INDICATOR
  isTyping = false,
  typingUserName,

  // SEND
  isSending = false,

  // GROUP
  onGroupUpdated,
  onGroupDeleted,
  onGroupLeft,
}: ChatUIProps) {
  // ==================================================
  // GROUP MODAL STATE
  // ==================================================

  const [
    isGroupModalOpen,
    setIsGroupModalOpen,
  ] = useState(false);

  // ==================================================
  // NO CONVERSATION
  // ==================================================

  if (!conversation) {
    return (
      <main className="flex min-h-0 flex-1 flex-col bg-white">
        <EmptyChat />
      </main>
    );
  }

  // ==================================================
  // OTHER USER
  // ==================================================

  const otherUser =
    getOtherParticipant(
      conversation,
      currentUserId,
    );

  // ==================================================
  // NAME
  // ==================================================

  const conversationName =
    getConversationName(
      conversation,
      currentUserId,
    );

  // ==================================================
  // AVATAR
  // ==================================================

  const conversationAvatar =
    getConversationAvatar(
      conversation,
      currentUserId,
    );

  // ==================================================
  // TYPING NAME
  // ==================================================

  const displayTypingName =
    typingUserName?.trim() ||
    "Someone";

  // ==================================================
  // OPEN GROUP DETAILS
  // ==================================================

  const handleOpenGroupDetails =
    () => {
      if (
        conversation.type !==
        "group"
      ) {
        return;
      }

      setIsGroupModalOpen(true);
    };

  // ==================================================
  // GROUP UPDATED
  // ==================================================

  const handleGroupUpdated = (
    updatedConversation: Conversation,
  ) => {
    onGroupUpdated?.(
      updatedConversation,
    );
  };

  // ==================================================
  // GROUP DELETED
  // ==================================================

  const handleGroupDeleted = (
    conversationId: string,
  ) => {
    setIsGroupModalOpen(false);

    onGroupDeleted?.(
      conversationId,
    );
  };

  // ==================================================
  // GROUP LEFT
  // ==================================================

  const handleGroupLeft = () => {
    setIsGroupModalOpen(false);

    onGroupLeft?.();
  };

  // ==================================================
  // UI
  // ==================================================

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
        onOpenSidebar={
          onOpenSidebar
        }
        onOpenProfile={
          onOpenProfile
        }
        onOpenGroupDetails={
          handleOpenGroupDetails
        }
      />

      {/* ==================================================
          MESSAGE LIST
      ================================================== */}

      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList
          conversationId={
            conversation._id
          }
          currentUserId={
            currentUserId
          }
          markMessageAsRead={
            markMessageAsRead
          }
          onReply={
            onReplyMessage
          }
          onDelete={
            onDeleteMessage
          }
          onEdit={
            onEditMessage
          }
          onReaction={
            onReactionMessage
          }
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
            name={
              displayTypingName
            }
          />
        )}
      </div>

      {/* ==================================================
          MESSAGE COMPOSER
      ================================================== */}

      <MessageComposer
        onSend={
          onSendMessage
        }
        onTypingStart={
          onTypingStart
        }
        onTypingStop={
          onTypingStop
        }
        isBlocked={
          isBlocked
        }
        replyingTo={
          replyingTo
        }
        onCancelReply={
          onCancelReply
        }
        disabled={
          isSending
        }
      />

      {/* ==================================================
          GROUP MANAGEMENT MODAL
      ================================================== */}

      {conversation.type ===
        "group" && (
        <GroupModal
          isOpen={
            isGroupModalOpen
          }
          onClose={() =>
            setIsGroupModalOpen(
              false,
            )
          }
          currentUserId={
            currentUserId
          }
          existingConversation={
            conversation
          }
          onUpdated={
            handleGroupUpdated
          }
          onLeft={
            handleGroupLeft
          }
          onDeleted={
            handleGroupDeleted
          }
        />
      )}
    </main>
  );
}