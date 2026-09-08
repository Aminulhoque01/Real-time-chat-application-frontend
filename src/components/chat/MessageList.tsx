"use client";

import { MessageCircle } from "lucide-react";

import MessageBubble from "./MessageBubble";

import { useGetMessagesQuery } from "@/src/redux/features/message/messageApi";
import { useAppSelector } from "@/src/redux/hooks";

interface MessageListProps {
  conversationId: string;
}

export default function MessageList({
  conversationId,
}: MessageListProps) {
  const user = useAppSelector(
    (state) => state.auth.user,
  );

  const {
    data,
    isLoading,
    isError,
  } = useGetMessagesQuery({
    conversationId,
    page: 1,
    limit: 30,
  });

  const messages = data?.messages ?? [];

  /*
   * Loading
   */
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={`flex ${
                item % 2 === 0
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className="
                  h-16 w-52
                  animate-pulse
                  rounded-2xl
                  bg-slate-100
                "
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /*
   * Error
   */
  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div
            className="
              mx-auto mb-3
              flex h-12 w-12
              items-center justify-center
              rounded-2xl
              bg-red-50
            "
          >
            <MessageCircle
              size={22}
              className="text-red-400"
            />
          </div>

          <p className="text-sm font-semibold text-red-500">
            Failed to load messages
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Please try again.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Empty
   */
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <div
            className="
              mx-auto mb-3
              flex h-14 w-14
              items-center justify-center
              rounded-2xl
              bg-slate-100
            "
          >
            <MessageCircle
              size={28}
              className="text-slate-300"
            />
          </div>

          <p className="text-sm font-semibold text-slate-600">
            No messages yet
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Start the conversation.
          </p>
        </div>
      </div>
    );
  }

  /*
   * Messages
   */
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        {messages.map((message) => {
          const senderId =
            typeof message.senderId === "string"
              ? message.senderId
              : message.senderId._id;

          const isMine =
            senderId === user?._id;

          return (
            <MessageBubble
              key={message._id}
              message={message}
              isMine={isMine}
            />
          );
        })}
      </div>
    </div>
  );
}