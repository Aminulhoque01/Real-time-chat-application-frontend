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

interface MessageListProps {
  conversationId: string;

  currentUserId?: string;

  markMessageAsRead?: (
    messageId: string,
  ) => void;
}

export default function MessageList({
  conversationId,
  currentUserId,
  markMessageAsRead,
}: MessageListProps) {
  const currentUser = useAppSelector(
    (state) => state.auth.user,
  );

  const {
    data,
    isLoading,
    isError,
  } = useGetMessagesQuery(
    {
      conversationId,
      page: 1,
      limit: 30,
    },
    {
      refetchOnMountOrArgChange: true,
    },
  );

  const messages = data?.messages ?? [];

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const previousMessageCount =
    useRef(0);

  /**
   * Keeps track of messages that we
   * have already emitted as read.
   *
   * This prevents duplicate:
   *
   * message:read
   *
   * socket events.
   */
  const markedReadMessageIds =
    useRef<Set<string>>(new Set());

  /**
   * Check whether the user is close
   * enough to the bottom of the chat.
   */
  const isNearBottom = () => {
    const container =
      containerRef.current;

    if (!container) {
      return true;
    }

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    return distanceFromBottom < 150;
  };

  /**
   * Scroll chat to bottom.
   */
  const scrollToBottom = (
    behavior: ScrollBehavior = "auto",
  ) => {
    bottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  };

  /**
   * Reset read tracking when the
   * selected conversation changes.
   */
  useEffect(() => {
    markedReadMessageIds.current.clear();
  }, [conversationId]);

  /**
   * Mark incoming unread messages as read.
   */
  useEffect(() => {
    if (
      isLoading ||
      !currentUserId ||
      !markMessageAsRead
    ) {
      return;
    }

    if (!conversationId) {
      return;
    }

   

    messages.forEach((message) => {
      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id;

      if (!senderId) {
        return;
      }

 
      if (
        String(senderId) ===
        String(currentUserId)
      ) {
        return;
      }

      const alreadyRead =
        message.readBy?.some(
          (userId) =>
            String(userId) ===
            String(currentUserId),
        ) ?? false;
 

      if (alreadyRead) {
        markedReadMessageIds.current.add(
          message._id,
        );

        return;
      }

      if (
        markedReadMessageIds.current.has(
          message._id,
        )
      ) {
        return;
      }

      markedReadMessageIds.current.add(
        message._id,
      );

      console.log(
        "MARKING MESSAGE AS READ:",
        message._id,
      );

      markMessageAsRead(message._id);
    });
  }, [
    conversationId,
    messages,
    isLoading,
    currentUserId,
    markMessageAsRead,
  ]);
  
    

  /**
   * Initial conversation scroll.
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    previousMessageCount.current =
      messages.length;

    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  }, [
    conversationId,
    isLoading,
  ]);

  /**
   * Scroll when new messages arrive.
   */
  useEffect(() => {
    if (isLoading) {
      return;
    }

    const currentCount =
      messages.length;

    const previousCount =
      previousMessageCount.current;

    if (
      currentCount >
      previousCount
    ) {
      const shouldScroll =
        isNearBottom();

      if (shouldScroll) {
        requestAnimationFrame(() => {
          scrollToBottom("smooth");
        });
      }
    }

    previousMessageCount.current =
      currentCount;
  }, [
    messages.length,
    isLoading,
  ]);

  /**
   * Loading state.
   */
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div
          className="
            h-7 w-7
            animate-spin
            rounded-full
            border-2
            border-slate-200
            border-t-slate-700
          "
        />
      </div>
    );
  }

  /**
   * Error state.
   */
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-400">
          Failed to load messages
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="
        h-full
        overflow-y-auto
        px-4
        py-5
        sm:px-6
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-4xl
          flex-col
          gap-3
        "
      >
        {messages.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-slate-400">
              No messages yet
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const senderId =
              typeof message.senderId ===
              "string"
                ? message.senderId
                : message.senderId?._id;

            const isMine =
              String(senderId) ===
              String(currentUser?._id);

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isMine={isMine}
              />
            );
          })
        )}

        <div
          ref={bottomRef}
          className="h-px w-full"
        />
      </div>
    </div>
  );
}