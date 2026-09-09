"use client";

import MessageBubble from "./MessageBubble";

import { useAppSelector } from "@/src/redux/hooks";

import { useGetMessagesQuery } from "@/src/redux/features/message/messageApi";

interface MessageListProps {
  conversationId: string;
}

export default function MessageList({
  conversationId,
}: MessageListProps) {
  const currentUser = useAppSelector(
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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-700" />
      </div>
    );
  }

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
    <div className="h-full overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm text-slate-400">
              No messages yet
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const senderId =
              typeof message.senderId === "string"
                ? message.senderId
                : message.senderId?._id;

            const isMine =
              senderId === currentUser?._id;

            return (
              <MessageBubble
                key={message._id}
                message={message}
                isMine={isMine}
              />
            );
          })
        )}
      </div>
    </div>
  );
}