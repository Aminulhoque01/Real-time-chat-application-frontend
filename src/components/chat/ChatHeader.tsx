


"use client";

import {
  Menu,
  MoreVertical,
  Phone,
  Users,
  Video,
} from "lucide-react";

import type {
  Conversation,
  ConversationUser,
} from "@/src/redux/features/conversation/conversation.types";

// ==================================================
// TYPES
// ==================================================

interface ChatHeaderProps {
  conversation: Conversation;
  name: string;
  avatar: string | null;
  otherUser: ConversationUser | null;

  onOpenSidebar: () => void;
  onOpenProfile: () => void;
  onOpenGroupDetails: () => void;

  // WebRTC calls
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  isCallDisabled?: boolean;
}

// ==================================================
// HELPERS
// ==================================================

const formatLastSeen = (date?: string | null): string => {
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

// ==================================================
// CHAT HEADER
// ==================================================

export default function ChatHeader({
  conversation,
  name,
  avatar,
  otherUser,
  onOpenSidebar,
  onOpenProfile,
  onOpenGroupDetails,
  onStartAudioCall,
  onStartVideoCall,
  isCallDisabled = false,
}: ChatHeaderProps) {
  const isGroup = conversation.type === "group";

  const canCall =
    !isGroup &&
    Boolean(otherUser?._id) &&
    !isCallDisabled;

  const displayAvatar = isGroup
    ? conversation.groupPhoto || null
    : avatar || otherUser?.avatar || null;

  const displayName = name?.trim() || "Unknown user";

  const initial = displayName.charAt(0).toUpperCase();

  const callDisabledReason = isGroup
    ? "Calls are available in direct chats only"
    : isCallDisabled
      ? "A call is already in progress"
      : !otherUser?._id
        ? "User information is unavailable"
        : "";

  // ==================================================
  // PROFILE / GROUP DETAILS
  // ==================================================

  const handleProfileClick = () => {
    if (isGroup) {
      onOpenGroupDetails();
      return;
    }

    onOpenProfile();
  };

  // ==================================================
  // RENDER
  // ==================================================

  return (
    <header
      className="
        flex h-[68px] shrink-0
        items-center justify-between gap-2
        border-b border-slate-200
        bg-white px-3
        sm:h-[72px] sm:px-6
      "
    >
      {/* LEFT SIDE */}

      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        {/* MOBILE SIDEBAR */}

        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open conversations"
          title="Open conversations"
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-xl border border-slate-200
            bg-slate-50 text-slate-600
            transition-colors
            hover:bg-slate-100 hover:text-slate-900
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-blue-500
            active:scale-95
            lg:hidden
          "
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        {/* PROFILE / GROUP DETAILS */}

        <button
          type="button"
          onClick={handleProfileClick}
          aria-label={
            isGroup ? "Open group details" : "Open profile"
          }
          title={
            isGroup ? "Open group details" : "Open profile"
          }
          className="
            flex min-w-0 flex-1
            items-center gap-2
            rounded-xl px-1 py-1
            text-left transition-colors
            hover:bg-slate-50
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-blue-500
            sm:gap-3
          "
        >
          {/* AVATAR */}

          <div className="relative shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={`${displayName} avatar`}
                className="
                  h-10 w-10 rounded-full
                  border border-slate-100
                  object-cover
                  sm:h-11 sm:w-11
                "
              />
            ) : isGroup ? (
              <div
                className="
                  flex h-10 w-10 items-center
                  justify-center rounded-full
                  bg-slate-900 text-white
                  sm:h-11 sm:w-11
                "
              >
                <Users size={19} />
              </div>
            ) : (
              <div
                className="
                  flex h-10 w-10 items-center
                  justify-center rounded-full
                  bg-slate-900 text-sm font-bold
                  text-white
                  sm:h-11 sm:w-11
                "
              >
                {initial}
              </div>
            )}

            {/* ONLINE STATUS */}

            {!isGroup && otherUser?.isOnline && (
              <span
                aria-label="Online"
                title="Online"
                className="
                  absolute bottom-0 right-0
                  h-3 w-3 rounded-full
                  border-2 border-white
                  bg-emerald-500
                "
              />
            )}
          </div>

          {/* NAME + STATUS */}

          <div className="min-w-0 flex-1">
            <h2
              className="
                truncate text-sm font-bold
                text-slate-800
                sm:text-base
              "
            >
              {displayName}
            </h2>

            <p
              className="
                mt-0.5 truncate text-[10px]
                text-slate-400
                sm:text-xs
              "
            >
              {isGroup
                ? `${conversation.participants.length} members`
                : otherUser?.isOnline
                  ? "Active now"
                  : formatLastSeen(otherUser?.lastSeen)}
            </p>
          </div>
        </button>
      </div>

      {/* RIGHT ACTIONS */}

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {/* AUDIO CALL */}

        <button
          type="button"
          onClick={onStartAudioCall}
          disabled={!canCall}
          title={
            canCall
              ? "Start audio call"
              : callDisabledReason
          }
          aria-label="Start audio call"
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-xl text-slate-500
            transition-colors
            hover:bg-emerald-50 hover:text-emerald-600
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-emerald-500
            disabled:cursor-not-allowed
            disabled:opacity-30
            sm:h-10 sm:w-10
          "
        >
          <Phone size={18} />
        </button>

        {/* VIDEO CALL */}

        <button
          type="button"
          onClick={onStartVideoCall}
          disabled={!canCall}
          title={
            canCall
              ? "Start video call"
              : callDisabledReason
          }
          aria-label="Start video call"
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-xl text-slate-500
            transition-colors
            hover:bg-blue-50 hover:text-blue-600
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-blue-500
            disabled:cursor-not-allowed
            disabled:opacity-30
            sm:h-10 sm:w-10
          "
        >
          <Video size={19} />
        </button>

        {/* MORE OPTIONS */}

        <button
          type="button"
          aria-label="More options"
          title="More options"
          className="
            flex h-9 w-9 shrink-0
            items-center justify-center
            rounded-xl text-slate-400
            transition-colors
            hover:bg-slate-100 hover:text-slate-700
            focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-slate-400
            active:scale-95
          "
        >
          <MoreVertical size={19} />
        </button>
      </div>
    </header>
  );
}
 