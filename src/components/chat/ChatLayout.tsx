"use client";

import { useState } from "react";

import ChatSidebar from "./ChatSidebar";
import ChatUI from "./ChatUI";

import { useAppSelector } from "@/src/redux/hooks";

import { useGetConversationsQuery } from "@/src/redux/features/conversation/conversationApi";

export default function ChatLayout() {
  const user = useAppSelector(
    (state) => state.auth.user,
  );

  const {
    data: conversations = [],
  } = useGetConversationsQuery();

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation._id === selectedConversationId,
    ) ?? null;

  const handleSelectConversation = (
    conversationId: string,
  ) => {
    setSelectedConversationId(conversationId);
    setIsSidebarOpen(false);
  };

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSendMessage = (message: string) => {
    if (!selectedConversationId) {
      return;
    }

    console.log("Send message:", {
      conversationId: selectedConversationId,
      message,
    });

    // Socket/API send logic পরে এখানে connect করবো
  };

  return (
    <div className="relative flex h-screen min-h-0 overflow-hidden bg-slate-50">
      {/* ================= SIDEBAR ================= */}

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

      {/* ================= MOBILE OVERLAY ================= */}

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

      {/* ================= CHAT ================= */}

      <ChatUI
        conversation={selectedConversation}
        currentUserId={user?._id}
        onOpenSidebar={handleOpenSidebar}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}