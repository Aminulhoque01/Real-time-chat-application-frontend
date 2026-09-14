"use client";

import { useEffect, useRef } from "react";

import MessageBubble from "./MessageBubble";

import { useAppSelector } from "@/src/redux/hooks";

import { useGetMessagesQuery } from "@/src/redux/features/message/messageApi";

import type { Message } from "@/src/redux/features/message/message.types";

interface MessageListProps {
  conversationId: string;
  currentUserId?: string;

  markMessageAsRead?: (messageId: string) => void;

  onReply?: (message: Message) => void;

  onEdit?: (message: Message) => void;

  // Realtime message delete
  onDelete?: (messageId: string) => boolean;
}

export default function MessageList({
  conversationId,
  currentUserId,
  markMessageAsRead,
  onReply,
  onEdit,
  onDelete,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /**
   * Current logged-in user
   */
  const currentUser = useAppSelector(
    (state) => state.auth.user,
  );

  /**
   * Get messages from RTK Query cache
   */
  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useGetMessagesQuery(
    {
      conversationId,
      page: 1,
      limit: 30,
    },
    {
      skip: !conversationId,
    },
  );

  const messages = data?.messages ?? [];

  /**
   * Auto scroll to bottom when messages change
   */
  useEffect(() => {
    if (!bottomRef.current) return;

    bottomRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length, conversationId]);

  /**
   * Mark unread messages as read
   */
  useEffect(() => {
    if (!markMessageAsRead) return;

    if (!currentUser?._id) return;

    messages.forEach((message) => {
      if (message.isDeleted) return;

      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id;

      /**
       * Don't mark our own messages as read
       */
      if (String(senderId) === String(currentUser._id)) {
        return;
      }

      const readBy = message.readBy ?? [];

      const alreadyRead = readBy.some(
        (userId) =>
          String(userId) === String(currentUser._id),
      );

      if (!alreadyRead) {
        markMessageAsRead(String(message._id));
      }
    });
  }, [
    messages,
    currentUser?._id,
    markMessageAsRead,
  ]);

  /**
   * Loading state
   */
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading messages...
        </p>
      </div>
    );
  }

  /**
   * Error state
   */
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">
          Failed to load messages.
        </p>
      </div>
    );
  }

  /**
   * Empty conversation
   */
  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No messages yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-2">
        {messages.map((message) => {
          /**
           * senderId can be:
           *
           * string
           * OR
           * populated user object
           */
          const senderId =
            typeof message.senderId === "string"
              ? message.senderId
              : message.senderId?._id;

          /**
           * Check whether message belongs to current user
           */
          const isMine =
            String(senderId) ===
            String(
              currentUser?._id ?? currentUserId,
            );

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isMine={isMine}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          );
        })}

        {/* Scroll target */}
        <div ref={bottomRef} />
      </div>

      {/* Background fetching indicator */}
      {isFetching && !isLoading && (
        <div className="py-1 text-center">
          <span className="text-xs text-gray-400">
            Updating...
          </span>
        </div>
      )}
    </div>
  );
}