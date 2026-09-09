"use client";

import { useState } from "react";

import ChatSidebar from "./ChatSidebar";
import ChatUI from "./ChatUI";

import { useAppSelector } from "@/src/redux/hooks";

import { useGetConversationsQuery } from "@/src/redux/features/conversation/conversationApi";
import { useSendMessageMutation } from "@/src/redux/features/message/messageApi";


export default function ChatLayout() {
  const user = useAppSelector(
    (state) => state.auth.user,
  );

  const {
    data: conversations = [],
  } = useGetConversationsQuery();

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

   const [sendMessage, { isLoading: isSending }] =
  useSendMessageMutation();

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

  //  const handleSendMessage = async (message: string) => {
  //   if (!selectedConversationId || !message.trim()) {
  //     return;
  //   }

  //   try {
  //     await sendMessage({
  //       conversationId: selectedConversationId,
  //       text: message.trim(),
  //     }).unwrap();
  //   } catch (error) {
  //     console.error("Failed to send message:", error);
  //   }
  // };

  const handleSendMessage = async (message: string) => {
      if (!selectedConversationId || !message.trim()) {
        return;
      }

      console.log("SENDING MESSAGE:", {
        conversationId: selectedConversationId,
        text: message.trim(),
      });

      try {
        const result = await sendMessage({
          conversationId: selectedConversationId,
          text: message.trim(),
        }).unwrap();

        console.log("MESSAGE SENT SUCCESSFULLY:", result);
      } catch (error) {
        console.error("MESSAGE SEND ERROR:", error);
      }
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