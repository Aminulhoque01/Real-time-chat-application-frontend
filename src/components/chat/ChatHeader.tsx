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

interface ChatHeaderProps {
  conversation: Conversation;
  name: string;
  avatar: string | null;
  otherUser: ConversationUser | null;

  onOpenSidebar: () => void;
  onOpenProfile: () => void;

  // Group details
  onOpenGroupDetails: () => void;
}

// ==================================================
// FORMAT LAST SEEN
// ==================================================

const formatLastSeen = (date?: string | null) => {
  if (!date) {
    return "Offline";
  }

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
}: ChatHeaderProps) {
  const isGroup = conversation.type === "group";

  /*
   * Direct conversation:
   *   avatar prop
   *
   * Group conversation:
   *   conversation.groupPhoto
   */
  const displayAvatar = isGroup
    ? conversation.groupPhoto || null
    : avatar;

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

  return (
    <header
      className="
        flex
        h-[68px]
        shrink-0
        items-center
        justify-between
        border-b
        border-slate-100
        bg-white
        px-3
        sm:h-[72px]
        sm:px-6
      "
    >
      {/* ==================================================
          LEFT SIDE
      ================================================== */}

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {/* ==================================================
            MOBILE SIDEBAR BUTTON

            Desktop:
              hidden

            Mobile:
              visible
        ================================================== */}

        <button
          type="button"
          onClick={onOpenSidebar}
          aria-label="Open conversations"
          title="Open conversations"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-slate-50
            text-slate-600
            transition
            hover:bg-slate-100
            hover:text-slate-900
            active:scale-95
            lg:hidden
          "
        >
          <Menu size={20} strokeWidth={2} />
        </button>

        {/* ==================================================
            PROFILE / GROUP BUTTON
        ================================================== */}

        <button
          type="button"
          onClick={handleProfileClick}
          aria-label={
            isGroup
              ? "Open group details"
              : "Open profile"
          }
          className="
            flex
            min-w-0
            max-w-[calc(100vw-150px)]
            items-center
            gap-2
            rounded-xl
            px-1
            py-1
            text-left
            transition
            hover:bg-slate-50
            sm:max-w-[calc(100vw-220px)]
            sm:gap-3
          "
        >
          {/* ==================================================
              AVATAR
          ================================================== */}

          <div className="relative shrink-0">
            {displayAvatar ? (
              <img
                src={displayAvatar}
                alt={name}
                className="
                  h-10
                  w-10
                  rounded-full
                  object-cover
                  sm:h-11
                  sm:w-11
                "
              />
            ) : isGroup ? (
              /*
               * GROUP FALLBACK
               */
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-900
                  text-white
                  sm:h-11
                  sm:w-11
                "
              >
                <Users size={19} />
              </div>
            ) : (
              /*
               * DIRECT CHAT FALLBACK
               */
              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-900
                  text-sm
                  font-bold
                  text-white
                  sm:h-11
                  sm:w-11
                "
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            {/* ==================================================
                ONLINE STATUS
                DIRECT CHAT ONLY
            ================================================== */}

            {!isGroup && otherUser?.isOnline && (
              <span
                className="
                  absolute
                  bottom-0
                  right-0
                  h-3
                  w-3
                  rounded-full
                  border-2
                  border-white
                  bg-emerald-500
                "
              />
            )}
          </div>

          {/* ==================================================
              NAME + STATUS
          ================================================== */}

          <div className="min-w-0">
            <h2
              className="
                truncate
                text-sm
                font-bold
                text-slate-800
                sm:text-base
              "
            >
              {name}
            </h2>

            <p
              className="
                mt-0.5
                truncate
                text-[10px]
                text-slate-400
                sm:text-xs
              "
            >
              {isGroup
                ? `${conversation.participants.length} members`
                : otherUser?.isOnline
                  ? "Active now"
                  : formatLastSeen(
                      otherUser?.lastSeen,
                    )}
            </p>
          </div>
        </button>
      </div>

      {/* ==================================================
          RIGHT ACTIONS
      ================================================== */}

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        {/* ==================================================
            PHONE
        ================================================== */}

        <button
          type="button"
          className="
            hidden
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
            sm:flex
          "
          aria-label="Start phone call"
        >
          <Phone size={18} />
        </button>

        {/* ==================================================
            VIDEO
        ================================================== */}

        <button
          type="button"
          className="
            hidden
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
            sm:flex
          "
          aria-label="Start video call"
        >
          <Video size={19} />
        </button>

        {/* ==================================================
            MORE
        ================================================== */}

        <button
          type="button"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-slate-400
            transition
            hover:bg-slate-100
            hover:text-slate-700
            active:scale-95
            hover:bg-slate-100
            hover:text-slate-700
          "
          aria-label="More options"
        >
          <MoreVertical size={19} />
        </button>
      </div>
    </header>
  );
}