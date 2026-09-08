"use client";

import {
  Menu,
  MoreVertical,
  Phone,
  Video,
} from "lucide-react";

import type {
  Conversation,
  ConversationUser,
} from "@/src/redux/features/conversation/conversation.types";

interface ChatHeaderProps {
  conversation: Conversation;
  name: string;
  avatar: string | null;
  otherUser: ConversationUser | null;
  onOpenSidebar: () => void;
}

const formatLastSeen = (date?: string) => {
  if (!date) return "Offline";

  const lastSeen = new Date(date);

  if (Number.isNaN(lastSeen.getTime())) {
    return "Offline";
  }

  return `Last seen ${lastSeen.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

export default function ChatHeader({
  conversation,
  name,
  avatar,
  otherUser,
  onOpenSidebar,
}: ChatHeaderProps) {
  return (
    <header
      className="
        flex h-[72px] shrink-0
        items-center justify-between
        border-b border-slate-100
        px-4 sm:px-6
      "
    >
      {/* Left */}
      <div className="flex min-w-0 items-center gap-3">

        {/* Mobile sidebar button */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl bg-slate-100
            text-slate-600
            lg:hidden
          "
        >
          <Menu size={19} />
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="
                h-11 w-11
                rounded-full
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-full
                bg-slate-900
                text-sm font-bold
                text-white
              "
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Online indicator */}
          {conversation.type === "direct" &&
            otherUser?.isOnline && (
              <span
                className="
                  absolute bottom-0 right-0
                  h-3 w-3
                  rounded-full
                  border-2 border-white
                  bg-emerald-500
                "
              />
            )}
        </div>

        {/* User information */}
        <div className="min-w-0">
          <h2
            className="
              truncate text-sm font-bold
              text-slate-800
              sm:text-base
            "
          >
            {name}
          </h2>

          <p
            className="
              mt-0.5 truncate
              text-[11px] text-slate-400
              sm:text-xs
            "
          >
            {conversation.type === "group"
              ? `${conversation.participants.length} members`
              : otherUser?.isOnline
                ? "Active now"
                : formatLastSeen(otherUser?.lastSeen)}
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">

        {/* Phone */}
        <button
          type="button"
          className="
            hidden h-9 w-9
            items-center justify-center
            rounded-xl
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
            sm:flex
          "
        >
          <Phone size={18} />
        </button>

        {/* Video */}
        <button
          type="button"
          className="
            hidden h-9 w-9
            items-center justify-center
            rounded-xl
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
            sm:flex
          "
        >
          <Video size={19} />
        </button>

        {/* More */}
        <button
          type="button"
          className="
            flex h-9 w-9
            items-center justify-center
            rounded-xl
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
          "
        >
          <MoreVertical size={19} />
        </button>
      </div>
    </header>
  );
}