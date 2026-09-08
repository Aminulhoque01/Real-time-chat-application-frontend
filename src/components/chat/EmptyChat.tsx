"use client";

import { MessageCircle } from "lucide-react";

interface EmptyChatProps {
  onOpenSidebar?: () => void;
}

export default function EmptyChat({
  onOpenSidebar,
}: EmptyChatProps) {
  return (
    <div className="flex h-full flex-1 items-center justify-center bg-slate-50 px-6">
      <div className="flex max-w-md flex-col items-center text-center">
        {/* Icon */}
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 shadow-lg">
          <MessageCircle
            size={36}
            strokeWidth={1.8}
            className="text-white"
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
          Welcome to Chat
        </h2>

        {/* Description */}
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Select a conversation from the sidebar to start
          chatting with your friends and teammates.
        </p>

        {/* Mobile button */}
        {onOpenSidebar && (
          <button
            type="button"
            onClick={onOpenSidebar}
            className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 md:hidden"
          >
            Open Conversations
          </button>
        )}
      </div>
    </div>
  );
}