"use client";

import { Conversation, ConversationUser } from "@/src/redux/features/conversation/conversation.types";
import { useGetConversationsQuery } from "@/src/redux/features/conversation/conversationApi";
import { useAppSelector } from "@/src/redux/hooks";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Menu,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  Smile,
  Video,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

 

 

const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
): ConversationUser | null => {
  if (conversation.type !== "direct") {
    return null;
  }

  return (
    conversation.participants.find(
      (participant) => participant._id !== currentUserId,
    ) ?? null
  );
};

const getConversationName = (
  conversation: Conversation,
  currentUserId?: string,
) => {
  if (conversation.type === "group") {
    return conversation.name || "Unnamed Group";
  }

  return (
    getOtherParticipant(conversation, currentUserId)?.name ||
    "Unknown User"
  );
};

const getConversationAvatar = (
  conversation: Conversation,
  currentUserId?: string,
) => {
  if (conversation.type === "group") {
    return null;
  }

  return (
    getOtherParticipant(conversation, currentUserId)?.avatar || null
  );
};

const formatTime = (date?: string) => {
  if (!date) return "";

  const messageDate = new Date(date);

  if (Number.isNaN(messageDate.getTime())) {
    return "";
  }

  return messageDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

export default function ChatPage() {
  const user = useAppSelector((state) => state.auth.user);

  const {
    data: conversations = [],
    isLoading,
    isError,
  } = useGetConversationsQuery();

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return conversations;
    }

    return conversations.filter((conversation) => {
      const name = getConversationName(
        conversation,
        user?._id,
      ).toLowerCase();

      const lastMessage =
        conversation.lastMessage?.text?.toLowerCase() || "";

      return (
        name.includes(value) ||
        lastMessage.includes(value)
      );
    });
  }, [conversations, search, user?._id]);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation._id === selectedConversationId,
    ) ?? null;

  const selectedName = selectedConversation
    ? getConversationName(
        selectedConversation,
        user?._id,
      )
    : "";

  const selectedAvatar = selectedConversation
    ? getConversationAvatar(
        selectedConversation,
        user?._id,
      )
    : null;

  const selectedOtherUser = selectedConversation
    ? getOtherParticipant(
        selectedConversation,
        user?._id,
      )
    : null;

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setSidebarOpen(false);
  };

  const handleSendMessage = () => {
    const text = message.trim();

    if (!text) {
      return;
    }

    /*
     * Socket message sending will be connected here.
     *
     * Example later:
     *
     * socket.emit("message:send", {
     *   conversationId: selectedConversationId,
     *   text,
     * });
     */

    setMessage("");
  };

  return (
    <main className="h-screen w-full overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="flex h-full w-full">
        {/* ================= SIDEBAR ================= */}

        <aside
          className={`
            absolute z-40 flex h-full w-[320px] flex-col
            border-r border-slate-200 bg-white
            transition-transform duration-300
            lg:relative lg:translate-x-0
            ${
              sidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          {/* Sidebar Header */}

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
                  flex h-9 w-9 items-center justify-center
                  rounded-xl bg-slate-100 text-slate-500
                  transition hover:bg-slate-200
                "
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Search */}

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
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-slate-300
                  focus:bg-white
                  focus:ring-2
                  focus:ring-slate-100
                "
              />
            </div>
          </div>

          {/* Conversation List */}

          <div className="flex-1 overflow-y-auto px-3 py-3">
            {isLoading && (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <div
                    key={item}
                    className="
                      flex animate-pulse items-center gap-3
                      rounded-xl p-3
                    "
                  >
                    <div className="h-12 w-12 rounded-full bg-slate-200" />

                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-28 rounded bg-slate-200" />
                      <div className="h-3 w-40 rounded bg-slate-100" />
                    </div>
                  </div>
                ))}
              </div>
            )}

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

            {!isLoading &&
              !isError &&
              filteredConversations.length === 0 && (
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

            <div className="space-y-1">
              {filteredConversations.map(
                (conversation) => {
                  const name = getConversationName(
                    conversation,
                    user?._id,
                  );

                  const avatar = getConversationAvatar(
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

                  return (
                    <button
                      key={conversation._id}
                      type="button"
                      onClick={() =>
                        handleSelectConversation(
                          conversation._id,
                        )
                      }
                      className={`
                        group flex w-full items-center gap-3
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
                              h-12 w-12 rounded-full
                              object-cover
                            "
                          />
                        ) : (
                          <div
                            className="
                              flex h-12 w-12
                              items-center justify-center
                              rounded-full
                              bg-slate-900
                              text-sm font-bold text-white
                            "
                          >
                            {name
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}

                        {conversation.type ===
                          "direct" &&
                          otherUser?.isOnline && (
                            <span
                              className="
                                absolute bottom-0
                                right-0 h-3 w-3
                                rounded-full
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
                              conversation.lastMessage
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
                            {conversation.lastMessage
                              ?.text ||
                              "No messages yet"}
                          </p>

                          {conversation.unreadCount >
                            0 && (
                            <span
                              className="
                                flex h-5 min-w-5
                                items-center justify-center
                                rounded-full
                                bg-slate-900
                                px-1.5
                                text-[10px]
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
                p-3
                transition hover:bg-slate-100
              "
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="
                    h-11 w-11 rounded-full
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
                  flex h-8 w-8 items-center
                  justify-center rounded-lg
                  text-slate-400
                  transition hover:bg-white
                  hover:text-slate-700
                "
              >
                <MoreVertical size={17} />
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Overlay */}

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
            className="
              fixed inset-0 z-30
              bg-black/20 backdrop-blur-[1px]
              lg:hidden
            "
          />
        )}

        {/* ================= MAIN CHAT ================= */}

        <section className="flex min-w-0 flex-1 flex-col bg-white">
          {!selectedConversation ? (
            <div className="flex h-full flex-col">
              {/* Mobile Header */}

              <div
                className="
                  flex h-16 items-center
                  border-b border-slate-100
                  px-4 lg:hidden
                "
              >
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="
                    flex h-10 w-10 items-center
                    justify-center rounded-xl
                    bg-slate-100 text-slate-600
                  "
                >
                  <Menu size={20} />
                </button>

                <div className="ml-3">
                  <p className="font-semibold text-slate-800">
                    Messages
                  </p>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center p-6">
                <div className="max-w-sm text-center">
                  <div
                    className="
                      mx-auto mb-5 flex h-20 w-20
                      items-center justify-center
                      rounded-3xl bg-slate-100
                    "
                  >
                    <MessageCircle
                      size={36}
                      strokeWidth={1.5}
                      className="text-slate-400"
                    />
                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Welcome to your messages
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Select a conversation from the sidebar
                    to start chatting.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ================= CHAT HEADER ================= */}

              <header
                className="
                  flex h-[72px] shrink-0
                  items-center justify-between
                  border-b border-slate-100
                  px-4 sm:px-6
                "
              >
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
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

                  <div className="relative shrink-0">
                    {selectedAvatar ? (
                      <img
                        src={selectedAvatar}
                        alt={selectedName}
                        className="
                          h-11 w-11 rounded-full
                          object-cover
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
                        {selectedName
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    {selectedConversation.type ===
                      "direct" &&
                      selectedOtherUser?.isOnline && (
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

                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-bold text-slate-800 sm:text-base">
                      {selectedName}
                    </h2>

                    <p className="mt-0.5 truncate text-[11px] text-slate-400 sm:text-xs">
                      {selectedConversation.type ===
                      "group"
                        ? `${selectedConversation.participants.length} members`
                        : selectedOtherUser?.isOnline
                          ? "Active now"
                          : formatLastSeen(
                              selectedOtherUser?.lastSeen,
                            )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="
                      hidden h-9 w-9 items-center
                      justify-center rounded-xl
                      text-slate-400
                      transition hover:bg-slate-100
                      hover:text-slate-700
                      sm:flex
                    "
                  >
                    <Phone size={18} />
                  </button>

                  <button
                    type="button"
                    className="
                      hidden h-9 w-9 items-center
                      justify-center rounded-xl
                      text-slate-400
                      transition hover:bg-slate-100
                      hover:text-slate-700
                      sm:flex
                    "
                  >
                    <Video size={19} />
                  </button>

                  <button
                    type="button"
                    className="
                      flex h-9 w-9 items-center
                      justify-center rounded-xl
                      text-slate-400
                      transition hover:bg-slate-100
                      hover:text-slate-700
                    "
                  >
                    <MoreVertical size={19} />
                  </button>
                </div>
              </header>

              {/* ================= MESSAGE AREA ================= */}

              <div
                className="
                  flex-1 overflow-y-auto
                  bg-[#f8fafc]
                  px-4 py-6
                  sm:px-6
                "
              >
                <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end">
                  {/* Date */}

                  <div className="mb-6 flex justify-center">
                    <span
                      className="
                        rounded-full
                        bg-white px-3 py-1
                        text-[10px] font-medium
                        text-slate-400
                        shadow-sm
                      "
                    >
                      Today
                    </span>
                  </div>

                  {/* Demo received message */}

                  <div className="mb-4 flex items-end gap-2">
                    <div
                      className="
                        flex h-8 w-8 shrink-0
                        items-center justify-center
                        rounded-full bg-slate-900
                        text-[10px] font-bold text-white
                      "
                    >
                      {selectedName
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <div
                        className="
                          max-w-[280px]
                          rounded-2xl rounded-bl-md
                          bg-white
                          px-4 py-3
                          shadow-sm
                          sm:max-w-md
                        "
                      >
                        <p className="text-sm leading-6 text-slate-700">
                          Hello! 👋
                        </p>
                      </div>

                      <p className="mt-1 px-1 text-[10px] text-slate-400">
                        10:30 AM
                      </p>
                    </div>
                  </div>

                  {/* Demo sent message */}

                  <div className="mb-4 flex justify-end">
                    <div className="max-w-[280px] sm:max-w-md">
                      <div
                        className="
                          rounded-2xl rounded-br-md
                          bg-slate-900
                          px-4 py-3
                          text-white
                          shadow-sm
                        "
                      >
                        <p className="text-sm leading-6">
                          Hey! Nice to see you here. How are
                          you doing?
                        </p>
                      </div>

                      <div className="mt-1 flex items-center justify-end gap-1 px-1">
                        <span className="text-[10px] text-slate-400">
                          10:31 AM
                        </span>

                        <CheckCheck
                          size={14}
                          className="text-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Empty / future socket messages */}

                  <div className="mt-4 flex justify-center">
                    <span className="text-[10px] text-slate-300">
                      Real-time messages will appear here
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= COMPOSER ================= */}

              <div className="border-t border-slate-100 bg-white p-3 sm:p-4">
                <div className="mx-auto flex max-w-4xl items-end gap-2">
                  <button
                    type="button"
                    className="
                      mb-1 flex h-10 w-10
                      shrink-0 items-center
                      justify-center rounded-xl
                      text-slate-400
                      transition hover:bg-slate-100
                      hover:text-slate-700
                    "
                  >
                    <Paperclip size={20} />
                  </button>

                  <div
                    className="
                      flex min-h-[44px] flex-1
                      items-end rounded-2xl
                      border border-slate-200
                      bg-slate-50
                      px-3 py-1
                      transition
                      focus-within:border-slate-300
                      focus-within:bg-white
                      focus-within:ring-2
                      focus-within:ring-slate-100
                    "
                  >
                    <textarea
                      value={message}
                      onChange={(event) =>
                        setMessage(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey
                        ) {
                          event.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      rows={1}
                      placeholder="Type a message..."
                      className="
                        max-h-28 min-h-[38px]
                        flex-1 resize-none
                        bg-transparent
                        py-2
                        text-sm text-slate-700
                        outline-none
                        placeholder:text-slate-400
                      "
                    />

                    <button
                      type="button"
                      className="
                        mb-1 flex h-8 w-8
                        shrink-0 items-center
                        justify-center rounded-lg
                        text-slate-400
                        transition hover:bg-slate-100
                        hover:text-slate-700
                      "
                    >
                      <Smile size={19} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="
                      mb-1 flex h-11 w-11
                      shrink-0 items-center
                      justify-center
                      rounded-xl
                      bg-slate-900
                      text-white
                      shadow-sm
                      transition
                      hover:bg-slate-800
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    <Send size={18} />
                  </button>
                </div>

                <p className="mx-auto mt-2 hidden max-w-4xl text-[10px] text-slate-300 sm:block">
                  Press Enter to send • Shift + Enter for
                  new line
                </p>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}