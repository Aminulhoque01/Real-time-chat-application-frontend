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
    useRef<HTMLDivElement | null>(null);

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
      block: "end",
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
        // System messages
        // -----------------------------

        if (
          message.type === "system"
        ) {
          return;
        }

        // -----------------------------
        // Deleted messages
        // -----------------------------

        if (message.isDeleted) {
          return;
        }

        // -----------------------------
        // Sender ID
        // -----------------------------

        const senderId =
          typeof message.senderId ===
          "string"
            ? message.senderId
            : message.senderId?._id;

        // -----------------------------
        // Ignore own messages
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
        // Already read
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
      <div
        className="
          flex
          h-full
          min-h-0
          min-w-0
          items-center
          justify-center
          overflow-hidden
          px-4
        "
      >
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
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
      <div
        className="
          flex
          h-full
          min-h-0
          min-w-0
          items-center
          justify-center
          overflow-hidden
          px-4
        "
      >
        <p className="text-center text-sm text-red-500">
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
      <div
        className="
          flex
          h-full
          min-h-0
          min-w-0
          items-center
          justify-center
          overflow-hidden
          px-4
        "
      >
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          No messages yet.
        </p>
      </div>
    );
  }

  // =================================
  // MESSAGE LIST
  // =================================

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
      "
    >
      {/* =================================
          SCROLL CONTAINER
      ================================= */}

      <div
        className="
          min-h-0
          min-w-0
          flex-1
          overflow-x-hidden
          overflow-y-auto
          overscroll-contain
          px-2
          py-2
          sm:px-3
          sm:py-4
        "
        style={{
          WebkitOverflowScrolling:
            "touch",
        }}
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-4xl
            min-w-0
            flex-col
            gap-1.5
            sm:gap-2
          "
        >
          {messages.map(
            (message) => {
              // -----------------------------
              // Sender ID
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
                <div
                  key={String(
                    message._id,
                  )}
                  className="
                    min-w-0
                    max-w-full
                  "
                >
                  <MessageBubble
                    message={message}
                    isMine={isMine}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onReaction={
                      onReaction
                    }
                  />
                </div>
              );
            },
          )}

          {/* =================================
              BOTTOM SCROLL TARGET
          ================================= */}

          <div
            ref={bottomRef}
            className="h-px w-full shrink-0"
          />
        </div>

        {/* =================================
            BACKGROUND FETCHING
        ================================= */}

        {isFetching &&
          !isLoading && (
            <div className="py-1 text-center">
              <span className="text-[11px] text-gray-400 sm:text-xs">
                Updating...
              </span>
            </div>
          )}
      </div>
    </div>
  );
}