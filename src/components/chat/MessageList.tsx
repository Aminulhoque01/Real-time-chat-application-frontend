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
}

export default function MessageList({
  conversationId,
}: MessageListProps) {
  const currentUser = useAppSelector(
    (state) => state.auth.user,
  );

  const { data, isLoading, isError } =
  useGetMessagesQuery(
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

  /* ----------------------------------
     Scroll Refs
  ---------------------------------- */

  const containerRef =
    useRef<HTMLDivElement | null>(null);

  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  const previousMessageCount =
    useRef(0);

  /* ----------------------------------
     Check whether user is near bottom
  ---------------------------------- */

  const isNearBottom = () => {
    const container = containerRef.current;

    if (!container) return true;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    return distanceFromBottom < 150;
  };

  /* ----------------------------------
     Scroll to Bottom
  ---------------------------------- */

  const scrollToBottom = (
    behavior: ScrollBehavior = "auto",
  ) => {
    bottomRef.current?.scrollIntoView({
      behavior,
      block: "end",
    });
  };

  /* ----------------------------------
     Initial Load / Conversation Change
  ---------------------------------- */

  useEffect(() => {
    if (isLoading) return;

    previousMessageCount.current =
      messages.length;

    requestAnimationFrame(() => {
      scrollToBottom("auto");
    });
  }, [conversationId, isLoading]);

  /* ----------------------------------
     New Message
  ---------------------------------- */

  useEffect(() => {
    if (isLoading) return;

    const currentCount =
      messages.length;

    const previousCount =
      previousMessageCount.current;

    if (currentCount > previousCount) {
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

  /* ----------------------------------
     Loading
  ---------------------------------- */

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

  /* ----------------------------------
     Error
  ---------------------------------- */

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-red-400">
          Failed to load messages
        </p>
      </div>
    );
  }

  /* ----------------------------------
     UI
  ---------------------------------- */

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
              senderId ===
              currentUser?._id;

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isMine={isMine}
              />
            );
          })
        )}

        {/* Scroll Anchor */}

        <div
          ref={bottomRef}
          className="h-px w-full"
        />
      </div>
    </div>
  );
}