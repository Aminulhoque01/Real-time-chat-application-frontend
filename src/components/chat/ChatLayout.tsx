"use client";

import {
  useCallback,
  useState,
} from "react";

import ChatSidebar from "./ChatSidebar";
import ChatUI from "./ChatUI";
import type { MessageSendPayload } from "./MessageComposer";

import {
  useAppDispatch,
  useAppSelector,
} from "@/src/redux/hooks";

import {
  conversationApi,
  useGetConversationsQuery,
} from "@/src/redux/features/conversation/conversationApi";

import {
  useSendMessageMutation,
} from "@/src/redux/features/message/messageApi";

import type { Message } from "@/src/redux/features/message/message.types";

import useChatSocket from "@/src/hooks/useChatSocket";

export default function ChatLayout() {
  // =========================
  // REDUX DISPATCH
  // =========================

  const dispatch = useAppDispatch();

  // =========================
  // AUTH USER
  // =========================

  const user = useAppSelector(
    (state) => state.auth.user,
  );

  // =========================
  // CONVERSATIONS
  // =========================

  const {
    data: conversations = [],
  } = useGetConversationsQuery();

  // =========================
  // SELECTED CONVERSATION
  // =========================

  const [
    selectedConversationId,
    setSelectedConversationId,
  ] = useState<string | null>(null);

  // =========================
  // REPLY MESSAGE
  // =========================

  const [
    replyingTo,
    setReplyingTo,
  ] = useState<Message | null>(null);

  // =========================
  // SIDEBAR
  // =========================

  const [
    isSidebarOpen,
    setIsSidebarOpen,
  ] = useState(false);

  // =========================
  // SEND MESSAGE
  // =========================

  const [
    sendMessage,
    { isLoading: isSending },
  ] = useSendMessageMutation();

  // =========================
  // TYPING USER
  // =========================

  const [
    typingUserId,
    setTypingUserId,
  ] = useState<string | null>(null);

  // =========================
  // SELECTED CONVERSATION DATA
  // =========================

  const selectedConversation =
    conversations.find(
      (conversation) =>
        String(conversation._id) ===
        String(selectedConversationId),
    ) ?? null;

  // =========================
  // TYPING USER DATA
  // =========================

  const typingUser =
    selectedConversation?.participants.find(
      (participant) =>
        String(participant._id) ===
        String(typingUserId),
    );

  const typingUserName =
    typingUser?.name ||
    typingUser?.phone ||
    "Someone";

  // =========================
  // TYPING START CALLBACK
  // =========================

  const handleTypingStart =
    useCallback((userId: string) => {
      setTypingUserId(userId);
    }, []);

  // =========================
  // TYPING STOP CALLBACK
  // =========================

  const handleTypingStop =
    useCallback((userId: string) => {
      setTypingUserId((currentUserId) => {
        if (
          String(currentUserId) ===
          String(userId)
        ) {
          return null;
        }

        return currentUserId;
      });
    }, []);

  // =========================
  // SOCKET
  // =========================

  const {
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,

    // =================================
    // REALTIME DELETE
    // =================================

    deleteMessageRealtime,
  } = useChatSocket({
    conversationId:
      selectedConversationId,

    onTypingStart:
      handleTypingStart,

    onTypingStop:
      handleTypingStop,
  });

  // =========================
  // SELECT CONVERSATION
  // =========================

  const handleSelectConversation = (
    conversationId: string,
  ) => {
    // =================================
    // CLEAR TYPING USER
    // =================================

    setTypingUserId(null);

    // =================================
    // CLEAR REPLY
    // =================================

    setReplyingTo(null);

    // =================================
    // CLEAR UNREAD COUNT IMMEDIATELY
    // =================================

    dispatch(
      conversationApi.util.updateQueryData(
        "getConversations",
        undefined,
        (draft) => {
          const conversation =
            draft.find(
              (item) =>
                String(item._id) ===
                String(conversationId),
            );

          if (!conversation) {
            return;
          }

          conversation.unreadCount = 0;
        },
      ),
    );

    // =================================
    // SELECT CONVERSATION
    // =================================

    setSelectedConversationId(
      conversationId,
    );

    // =================================
    // CLOSE MOBILE SIDEBAR
    // =================================

    setIsSidebarOpen(false);
  };

  // =========================
  // REPLY TO MESSAGE
  // =========================

  const handleReplyMessage = (
    message: Message,
  ) => {
    setReplyingTo(message);
  };

  // =========================
  // CANCEL REPLY
  // =========================

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  // =========================
  // OPEN SIDEBAR
  // =========================

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  // =========================
  // CLOSE SIDEBAR
  // =========================

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  // =========================
  // SEND MESSAGE
  // =========================

  const handleSendMessage = async (
    payload: MessageSendPayload,
  ) => {
    if (!selectedConversationId) {
      return;
    }

    const text =
      payload.text?.trim();

    const attachments =
      payload.attachments;

    const replyTo =
      payload.replyTo;

    // =================================
    // VALIDATE
    // =================================

    if (
      !text &&
      (!attachments ||
        attachments.length === 0)
    ) {
      return;
    }

    // =================================
    // DEBUG
    // =================================

    console.log(
      "SENDING MESSAGE:",
      {
        conversationId:
          selectedConversationId,

        text,

        replyTo,

        attachments,
      },
    );

    if (attachments) {
      console.log(
        "ATTACHMENT FILES:",
        attachments.map(
          (file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          }),
        ),
      );
    }

    // =================================
    // SEND TO BACKEND
    // =================================

    try {
      const result =
        await sendMessage({
          conversationId:
            selectedConversationId,

          text:
            text || undefined,

          replyTo:
            replyTo || undefined,

          attachments:
            attachments &&
            attachments.length > 0
              ? attachments
              : undefined,
        }).unwrap();

      console.log(
        "MESSAGE SENT SUCCESSFULLY:",
        result,
      );

      // =================================
      // CLEAR REPLY AFTER SUCCESS
      // =================================

      setReplyingTo(null);
    } catch (error) {
      console.error(
        "MESSAGE SEND ERROR:",
        error,
      );
    }
  };

  // =========================
  // TYPING STATUS
  // =========================

  const isTyping =
    typingUserId !== null &&
    String(typingUserId) !==
      String(user?._id);

  // =========================
  // UI
  // =========================

  return (
    <div className="relative flex h-screen min-h-0 overflow-hidden bg-slate-50">
      {/* =========================
          CHAT SIDEBAR
      ========================= */}

      <ChatSidebar
        selectedConversationId={
          selectedConversationId
        }
        onSelectConversation={
          handleSelectConversation
        }
        isOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
      />

      {/* =========================
          MOBILE SIDEBAR OVERLAY
      ========================= */}

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={handleCloseSidebar}
          className="
            absolute
            inset-0
            z-30
            bg-black/20
            lg:hidden
          "
        />
      )}

      {/* =========================
          CHAT UI
      ========================= */}

      <ChatUI
        conversation={
          selectedConversation
        }

        currentUserId={
          user?._id
        }

        onOpenSidebar={
          handleOpenSidebar
        }

        // =================================
        // SEND MESSAGE
        // =================================

        onSendMessage={
          handleSendMessage
        }

        // =================================
        // TYPING
        // =================================

        onTypingStart={
          sendTypingStart
        }

        onTypingStop={
          sendTypingStop
        }

        // =================================
        // READ / SEEN
        // =================================

        markMessageAsRead={
          markMessageAsRead
        }

        // =================================
        // REALTIME DELETE
        // =================================

        onDeleteMessage={
          deleteMessageRealtime
        }

        // =================================
        // TYPING INDICATOR
        // =================================

        isTyping={
          isTyping
        }

        typingUserName={
          typingUserName
        }

        // =================================
        // REPLY
        // =================================

        replyingTo={
          replyingTo
        }

        onReplyMessage={
          handleReplyMessage
        }

        onCancelReply={
          handleCancelReply
        }

        // =================================
        // SEND LOADING
        // =================================

        isSending={
          isSending
        }
      />
    </div>
  );
}