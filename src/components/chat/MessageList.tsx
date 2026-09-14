"use client";

import {
  useEffect,
  useRef,
} from "react";

import MessageBubble from "./MessageBubble";

import { useAppSelector } from "@/src/redux/hooks";

import {
  useGetMessagesQuery,
} from "@/src/redux/features/message/messageApi";

import type { Message } from "@/src/redux/features/message/message.types";

interface MessageListProps {
  conversationId: string;

  currentUserId?: string;

  // =================================
  // READ / SEEN
  // =================================

  markMessageAsRead?: (
    messageId: string,
  ) => void;

  // =================================
  // REPLY
  // =================================

  onReply?: (
    message: Message,
  ) => void;

  // =================================
  // EDIT MESSAGE
  // =================================

  onEdit?: (
    messageId: string,
    text: string,
  ) => boolean;

  // =================================
  // DELETE MESSAGE
  // =================================

  onDelete?: (
    messageId: string,
  ) => boolean;

  // =================================
  // REACTION MESSAGE
  // =================================

  onReaction?: (
    messageId: string,
    emoji: string,
  ) => boolean;
}

export default function MessageList({
  conversationId,
  currentUserId,
  markMessageAsRead,
  onReply,
  onEdit,
  onDelete,
  onReaction,
}: MessageListProps) {
  // =================================
  // BOTTOM SCROLL REF
  // =================================

  const bottomRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  // =================================
  // CURRENT USER
  // =================================

  const currentUser =
    useAppSelector(
      (state) => state.auth.user,
    );

  // =================================
  // GET MESSAGES
  // =================================

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } =
    useGetMessagesQuery(
      {
        conversationId,
        page: 1,
        limit: 30,
      },
      {
        skip: !conversationId,
      },
    );

  // =================================
  // MESSAGE DATA
  // =================================

  const messages =
    data?.messages ?? [];

  // =================================
  // AUTO SCROLL
  // =================================

  useEffect(() => {
    if (!bottomRef.current) {
      return;
    }

    bottomRef.current.scrollIntoView({
      behavior: "smooth",
    });
  }, [
    messages.length,
    conversationId,
  ]);

  // =================================
  // MARK MESSAGES AS READ
  // =================================

  useEffect(() => {
    if (!markMessageAsRead) {
      return;
    }

    if (!currentUser?._id) {
      return;
    }

    messages.forEach(
      (message) => {
        // -----------------------------
        // Ignore deleted messages
        // -----------------------------

        if (message.isDeleted) {
          return;
        }

        // -----------------------------
        // Get sender ID
        // -----------------------------

        const senderId =
          typeof message.senderId ===
          "string"
            ? message.senderId
            : message.senderId?._id;

        // -----------------------------
        // Don't mark own messages
        // -----------------------------

        if (
          String(senderId) ===
          String(currentUser._id)
        ) {
          return;
        }

        // -----------------------------
        // Existing readBy
        // -----------------------------

        const readBy =
          message.readBy ?? [];

        // -----------------------------
        // Already read?
        // -----------------------------

        const alreadyRead =
          readBy.some(
            (userId) =>
              String(userId) ===
              String(
                currentUser._id,
              ),
          );

        // -----------------------------
        // Mark as read
        // -----------------------------

        if (!alreadyRead) {
          markMessageAsRead(
            String(message._id),
          );
        }
      },
    );
  }, [
    messages,
    currentUser?._id,
    markMessageAsRead,
  ]);

  // =================================
  // LOADING
  // =================================

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Loading messages...
        </p>
      </div>
    );
  }

  // =================================
  // ERROR
  // =================================

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-500">
          Failed to load messages.
        </p>
      </div>
    );
  }

  // =================================
  // EMPTY
  // =================================

  if (
    messages.length === 0
  ) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No messages yet.
        </p>
      </div>
    );
  }

  // =================================
  // MESSAGE LIST
  // =================================

  return (
    <div className="flex h-full flex-col overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-2">
        {messages.map(
          (message) => {
            // -----------------------------
            // Get sender ID
            // -----------------------------

            const senderId =
              typeof message.senderId ===
              "string"
                ? message.senderId
                : message.senderId?._id;

            // -----------------------------
            // Check own message
            // -----------------------------

            const isMine =
              String(senderId) ===
              String(
                currentUser?._id ??
                  currentUserId,
              );

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isMine={isMine}

                // -----------------------------
                // Reply
                // -----------------------------

                onReply={
                  onReply
                }

                // -----------------------------
                // Edit
                // -----------------------------

                onEdit={
                  onEdit
                }

                // -----------------------------
                // Delete
                // -----------------------------

                onDelete={
                  onDelete
                }

                // -----------------------------
                // Reaction
                // -----------------------------

                onReaction={
                  onReaction
                }
              />
            );
          },
        )}

        {/* =================================
            BOTTOM SCROLL TARGET
        ================================= */}

        <div
          ref={bottomRef}
        />
      </div>

      {/* =================================
          BACKGROUND FETCHING
      ================================= */}

      {isFetching &&
        !isLoading && (
          <div className="py-1 text-center">
            <span className="text-xs text-gray-400">
              Updating...
            </span>
          </div>
        )}
    </div>
  );
}