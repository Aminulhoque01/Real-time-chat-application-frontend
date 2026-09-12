"use client";

import {
  useCallback,
  useState,
} from "react";

import ChatSidebar from "./ChatSidebar";
import ChatUI from "./ChatUI";

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
        conversation._id ===
        selectedConversationId,
    ) ?? null;

  // =========================
  // TYPING USER DATA
  // =========================

  const typingUser =
    selectedConversation?.participants.find(
      (participant) =>
        participant._id === typingUserId,
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
        if (currentUserId === userId) {
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
    // Clear previous typing user
    setTypingUserId(null);

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
    message: string,
  ) => {
    if (
      !selectedConversationId ||
      !message.trim()
    ) {
      return;
    }

    console.log(
      "SENDING MESSAGE:",
      {
        conversationId:
          selectedConversationId,
        text: message.trim(),
      },
    );

    try {
      const result =
        await sendMessage({
          conversationId:
            selectedConversationId,
          text: message.trim(),
        }).unwrap();

      console.log(
        "MESSAGE SENT SUCCESSFULLY:",
        result,
      );
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
    typingUserId !== user?._id;

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
            absolute inset-0 z-30
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
        currentUserId={user?._id}
        onOpenSidebar={
          handleOpenSidebar
        }
        onSendMessage={
          handleSendMessage
        }
        onTypingStart={
          sendTypingStart
        }
        onTypingStop={
          sendTypingStop
        }
        markMessageAsRead={
          markMessageAsRead
        }
        isTyping={isTyping}
        typingUserName={
          typingUserName
        }
      />
    </div>
  );
}