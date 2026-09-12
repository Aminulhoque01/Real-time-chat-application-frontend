"use client";

import {
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAppSelector } from "@/src/redux/hooks";
import { useGetConversationsQuery } from "@/src/redux/features/conversation/conversationApi";

interface ChatSidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const formatTime = (date?: string) => {
  if (!date) return "";

  const messageDate = new Date(date);

  if (Number.isNaN(messageDate.getTime())) {
    return "";
  }

  const now = new Date();

  const isToday =
    messageDate.toDateString() ===
    now.toDateString();

  if (isToday) {
    return messageDate.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return messageDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
};

/* ----------------------------------
   Get Other Participant
---------------------------------- */

const getOtherParticipant = (
  conversation: any,
  currentUserId?: string,
) => {
  if (conversation.type !== "direct") {
    return null;
  }

  return (
    conversation.participants.find(
      (participant: any) =>
        participant._id !== currentUserId,
    ) ?? null
  );
};

/* ----------------------------------
   Conversation Name
---------------------------------- */

const getConversationName = (
  conversation: any,
  currentUserId?: string,
) => {
  if (conversation.type === "group") {
    return conversation.name || "Group";
  }

  const otherUser =
    getOtherParticipant(
      conversation,
      currentUserId,
    );

  return (
    otherUser?.name ||
    otherUser?.phone ||
    "Unknown"
  );
};

/* ----------------------------------
   Conversation Avatar
---------------------------------- */

const getConversationAvatar = (
  conversation: any,
  currentUserId?: string,
) => {
  if (conversation.type === "group") {
    return null;
  }

  const otherUser =
    getOtherParticipant(
      conversation,
      currentUserId,
    );

  return otherUser?.avatar || null;
};

/* ----------------------------------
   Last Message Preview
---------------------------------- */

const getLastMessagePreview = (
  conversation: any,
) => {
  const lastMessage =
    conversation.lastMessage;

  if (!lastMessage) {
    return "No messages yet";
  }

  // Text message
  if (lastMessage.text?.trim()) {
    return lastMessage.text;
  }

  // Attachments
  const attachments =
    lastMessage.attachments;

  if (
    Array.isArray(attachments) &&
    attachments.length > 0
  ) {
    const firstAttachment =
      attachments[0];

    switch (firstAttachment?.type) {
      case "audio":
        return "🎤 Voice message";

      case "video":
        return "🎥 Video";

      case "image":
        return "🖼️ Image";

      default:
        return "📎 File";
    }
  }

  return "No messages yet";
};

export default function ChatSidebar({
  selectedConversationId,
  onSelectConversation,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const user = useAppSelector(
    (state) => state.auth.user,
  );

  const {
    data: conversations = [],
    isLoading,
    isError,
  } = useGetConversationsQuery();

  const [search, setSearch] = useState("");

  const filteredConversations =
    useMemo(() => {
      const value =
        search.trim().toLowerCase();

      if (!value) {
        return conversations;
      }

      return conversations.filter(
        (conversation) => {
          const name =
            getConversationName(
              conversation,
              user?._id,
            ).toLowerCase();

          const lastMessage =
            getLastMessagePreview(
              conversation,
            ).toLowerCase();

          return (
            name.includes(value) ||
            lastMessage.includes(value)
          );
        },
      );
    }, [
      conversations,
      search,
      user?._id,
    ]);

  return (
    <aside
      className={`
        absolute z-40 flex h-full w-[320px]
        flex-col border-r border-slate-200
        bg-white transition-transform duration-300
        lg:relative lg:translate-x-0
        ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }
      `}
    >
      {/* ================= HEADER ================= */}

      <div className="border-b border-slate-100 px-5 pb-4 pt-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Messages
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              {conversations.length} conversations
            </p>
          </div>

          <button
            type="button"
            className="
              flex h-9 w-9 items-center
              justify-center rounded-xl
              bg-slate-100 text-slate-500
              transition hover:bg-slate-200
            "
            title="New conversation"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* ================= SEARCH ================= */}

        <div className="relative">
          <Search
            size={17}
            className="
              absolute left-3 top-1/2
              -translate-y-1/2 text-slate-400
            "
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search conversations..."
            className="
              h-11 w-full rounded-xl
              border border-slate-200
              bg-slate-50 pl-10 pr-4
              text-sm text-slate-700
              outline-none transition
              placeholder:text-slate-400
              focus:border-slate-300
              focus:bg-white
              focus:ring-2
              focus:ring-slate-100
            "
          />
        </div>
      </div>

      {/* ================= CONVERSATIONS ================= */}

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Loading */}

        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map(
              (item) => (
                <div
                  key={item}
                  className="
                    flex animate-pulse
                    items-center gap-3
                    rounded-xl p-3
                  "
                >
                  <div className="h-12 w-12 rounded-full bg-slate-200" />

                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 rounded bg-slate-200" />
                    <div className="h-3 w-40 rounded bg-slate-100" />
                  </div>
                </div>
              ),
            )}
          </div>
        )}

        {/* Error */}

        {isError && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center">
            <p className="text-sm font-medium text-red-600">
              Failed to load conversations
            </p>

            <p className="mt-1 text-xs text-red-400">
              Please try again.
            </p>
          </div>
        )}

        {/* Empty */}

        {!isLoading &&
          !isError &&
          filteredConversations.length ===
            0 && (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <div
                className="
                  mb-3 flex h-14 w-14
                  items-center justify-center
                  rounded-2xl bg-slate-100
                "
              >
                <MessageCircle
                  size={25}
                  className="text-slate-400"
                />
              </div>

              <p className="text-sm font-semibold text-slate-700">
                No conversations
              </p>

              <p className="mt-1 max-w-[220px] text-xs text-slate-400">
                Start a new conversation to begin chatting.
              </p>
            </div>
          )}

        {/* Conversation List */}

        <div className="space-y-1">
          {filteredConversations.map(
            (conversation) => {
              const name =
                getConversationName(
                  conversation,
                  user?._id,
                );

              const avatar =
                getConversationAvatar(
                  conversation,
                  user?._id,
                );

              const otherUser =
                getOtherParticipant(
                  conversation,
                  user?._id,
                );

              const isActive =
                conversation._id ===
                selectedConversationId;

              const lastMessagePreview =
                getLastMessagePreview(
                  conversation,
                );

              return (
                <button
                  key={conversation._id}
                  type="button"
                  onClick={() =>
                    onSelectConversation(
                      conversation._id,
                    )
                  }
                  className={`
                    group flex w-full
                    items-center gap-3
                    rounded-xl p-3 text-left
                    transition
                    ${
                      isActive
                        ? "bg-slate-100"
                        : "hover:bg-slate-50"
                    }
                  `}
                >
                  {/* Avatar */}

                  <div className="relative shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className="
                          h-12 w-12
                          rounded-full object-cover
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex h-12 w-12
                          items-center justify-center
                          rounded-full bg-slate-900
                          text-sm font-bold text-white
                        "
                      >
                        {name
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    {/* Online */}

                    {conversation.type ===
                      "direct" &&
                      otherUser?.isOnline && (
                        <span
                          className="
                            absolute bottom-0 right-0
                            h-3 w-3 rounded-full
                            border-2 border-white
                            bg-emerald-500
                          "
                        />
                      )}
                  </div>

                  {/* Conversation Info */}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`
                          truncate text-sm
                          ${
                            conversation.unreadCount >
                            0
                              ? "font-bold text-slate-900"
                              : "font-semibold text-slate-700"
                          }
                        `}
                      >
                        {name}
                      </p>

                      <span className="shrink-0 text-[10px] text-slate-400">
                        {formatTime(
                          conversation
                            .lastMessage
                            ?.createdAt,
                        )}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p
                        className={`
                          truncate text-xs
                          ${
                            conversation.unreadCount >
                            0
                              ? "font-medium text-slate-600"
                              : "text-slate-400"
                          }
                        `}
                      >
                        {lastMessagePreview}
                      </p>

                      {/* Unread Count */}

                      {conversation.unreadCount >
                        0 && (
                        <span
                          className="
                            flex h-5 min-w-5
                            items-center justify-center
                            rounded-full bg-slate-900
                            px-1.5 text-[10px]
                            font-bold text-white
                          "
                        >
                          {conversation.unreadCount >
                          99
                            ? "99+"
                            : conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* ================= CURRENT USER ================= */}

      <div className="border-t border-slate-100 p-3">
        <div
          className="
            flex items-center gap-3
            rounded-xl bg-slate-50
            p-3 transition hover:bg-slate-100
          "
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="
                h-11 w-11
                rounded-full object-cover
              "
            />
          ) : (
            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-full bg-slate-900
                text-sm font-bold text-white
              "
            >
              {user?.name
                ?.charAt(0)
                .toUpperCase() || "U"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-800">
              {user?.name || "User"}
            </p>

            <div className="mt-0.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

              <span className="text-[11px] text-slate-400">
                Online
              </span>
            </div>
          </div>

          <button
            type="button"
            className="
              flex h-8 w-8
              items-center justify-center
              rounded-lg text-slate-400
              transition hover:bg-white
              hover:text-slate-700
            "
            title="More options"
          >
            <MoreVertical size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}