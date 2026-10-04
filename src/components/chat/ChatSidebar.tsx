"use client";

import {
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  Users,
  Loader2,
} from "lucide-react";

import { useMemo, useState } from "react";

import { useAppSelector } from "@/src/redux/hooks";

import {
  useGetConversationsQuery,
  useCreateDirectConversationMutation,
} from "@/src/redux/features/conversation/conversationApi";

import {
  useSearchUsersQuery,
} from "@/src/redux/features/auth/authApi";

import type {
  Conversation,
  ConversationUser,
} from "@/src/redux/features/conversation/conversation.types";

import CreateGroupModal from "@/src/components/chat/CreateGroupModal";

/* =========================================================
   TYPES
========================================================= */

interface ChatSidebarProps {
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;

  isOpen: boolean;
  onClose: () => void;

  onOpenProfile: () => void;
}

type SidebarAttachment = {
  type?: string | null;
};

type SidebarReaction = {
  emoji?: string | null;
  userId?: string | null;
};

type SidebarLastMessage = {
  text?: string | null;
  createdAt?: string | null;

  attachments?: SidebarAttachment[] | null;

  reactions?: SidebarReaction[] | null;
};

/* =========================================================
   FORMAT TIME
========================================================= */

const formatTime = (
  date?: string | null,
) => {
  if (!date) {
    return "";
  }

  const messageDate = new Date(date);

  if (Number.isNaN(messageDate.getTime())) {
    return "";
  }

  const now = new Date();

  const isToday =
    messageDate.toDateString() ===
    now.toDateString();

  if (isToday) {
    return messageDate.toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      },
    );
  }

  return messageDate.toLocaleDateString(
    [],
    {
      month: "short",
      day: "numeric",
    },
  );
};

/* =========================================================
   GET OTHER PARTICIPANT
========================================================= */

const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
): ConversationUser | null => {
  if (conversation.type !== "direct") {
    return null;
  }

  return (
    conversation.participants.find(
      (participant) =>
        participant._id !== currentUserId,
    ) ?? null
  );
};

/* =========================================================
   CONVERSATION NAME
========================================================= */

const getConversationName = (
  conversation: Conversation,
  currentUserId?: string,
): string => {
  if (conversation.type === "group") {
    return (
      conversation.name?.trim() ||
      "Group"
    );
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

/* =========================================================
   CONVERSATION AVATAR
========================================================= */

const getConversationAvatar = (
  conversation: Conversation,
  currentUserId?: string,
): string | null => {
  if (conversation.type === "group") {
    return (
      conversation.groupPhoto ||
      null
    );
  }

  const otherUser =
    getOtherParticipant(
      conversation,
      currentUserId,
    );

  return otherUser?.avatar || null;
};

/* =========================================================
   GET REACTION PREVIEW
========================================================= */

const getReactionPreview = (
  reactions?: SidebarReaction[] | null,
): string => {
  if (
    !Array.isArray(reactions) ||
    reactions.length === 0
  ) {
    return "";
  }

  /*
   * Collect valid emojis only.
   */
  const emojis = reactions
    .map((reaction) =>
      typeof reaction?.emoji === "string"
        ? reaction.emoji.trim()
        : "",
    )
    .filter(
      (
        emoji,
      ): emoji is string =>
        Boolean(emoji),
    );

  if (emojis.length === 0) {
    return "";
  }

  /*
   * Remove duplicate emojis.
   *
   * Example:
   *
   * ❤️
   * ❤️
   * 😂
   *
   * becomes:
   *
   * ❤️ 😂
   */
  const uniqueEmojis = [
    ...new Set(emojis),
  ];

  return uniqueEmojis.join(" ");
};

/* =========================================================
   LAST MESSAGE PREVIEW
========================================================= */

const getLastMessagePreview = (
  conversation: Conversation,
): string => {
  const rawLastMessage =
    conversation.lastMessage;

  if (!rawLastMessage) {
    return "No messages yet";
  }

  const lastMessage =
    rawLastMessage as unknown as
      SidebarLastMessage;

  /* =======================================================
     REACTIONS
  ======================================================= */

  const reactionPreview =
    getReactionPreview(
      lastMessage.reactions,
    );

  /* =======================================================
     TEXT
  ======================================================= */

  const text =
    typeof lastMessage.text ===
      "string"
      ? lastMessage.text.trim()
      : "";

  if (text) {
    if (reactionPreview) {
      return `${text}  ${reactionPreview}`;
    }

    return text;
  }

  /* =======================================================
     ATTACHMENTS
  ======================================================= */

  const attachments =
    lastMessage.attachments;

  if (
    Array.isArray(attachments) &&
    attachments.length > 0
  ) {
    const firstAttachment =
      attachments[0];

    let attachmentPreview =
      "📎 File";

    switch (
      firstAttachment?.type
        ?.toLowerCase()
    ) {
      case "audio":
        attachmentPreview =
          "🎤 Voice message";
        break;

      case "video":
        attachmentPreview =
          "🎥 Video";
        break;

      case "image":
        attachmentPreview =
          "🖼️ Image";
        break;

      case "document":
      case "pdf":
        attachmentPreview =
          "📄 Document";
        break;

      default:
        attachmentPreview =
          "📎 File";
        break;
    }

    if (reactionPreview) {
      return `${attachmentPreview}  ${reactionPreview}`;
    }

    return attachmentPreview;
  }

  /* =======================================================
     REACTION ONLY
  ======================================================= */

  if (reactionPreview) {
    return reactionPreview;
  }

  /* =======================================================
     FALLBACK
  ======================================================= */

  return "No messages yet";
};

/* =========================================================
   COMPONENT
========================================================= */

export default function ChatSidebar({
  selectedConversationId,
  onSelectConversation,
  isOpen,
  onClose,
  onOpenProfile,
}: ChatSidebarProps) {
  /* =======================================================
     CURRENT USER
  ======================================================= */

  const user = useAppSelector(
    (state) => state.auth.user,
  );

  /* =======================================================
     CONVERSATIONS
  ======================================================= */

  const {
    data: conversations = [],
    isLoading:
      isConversationsLoading,
    isError:
      isConversationsError,
  } = useGetConversationsQuery();

  /* =======================================================
     SEARCH STATE
  ======================================================= */

  const [search, setSearch] =
    useState("");

  const trimmedSearch =
    search.trim();

  const isSearching =
    trimmedSearch.length > 0;

  /* =======================================================
     SEARCH USERS
  ======================================================= */

  const {
    data: searchUsersData,
    isLoading: isUsersLoading,
    isFetching: isUsersFetching,
    isError: isUsersError,
  } = useSearchUsersQuery(
    {
      query: trimmedSearch,
      page: 1,
      limit: 20,
    },
    {
      skip: !isSearching,
    },
  );

  /* =======================================================
     CREATE DIRECT CONVERSATION
  ======================================================= */

  const [
    createDirectConversation,
    {
      isLoading:
        isCreatingDirectConversation,
    },
  ] =
    useCreateDirectConversationMutation();

  /* =======================================================
     CREATE GROUP MODAL
  ======================================================= */

  const [
    isCreateGroupOpen,
    setIsCreateGroupOpen,
  ] = useState(false);

  /* =======================================================
     SEARCH USERS RESULT
  ======================================================= */

  const searchUsers = useMemo(() => {
    if (!searchUsersData?.users) {
      return [];
    }

    return searchUsersData.users.filter(
      (searchUser) =>
        searchUser._id !== user?._id,
    );
  }, [
    searchUsersData,
    user?._id,
  ]);

  /* =======================================================
     SELECT EXISTING CONVERSATION
  ======================================================= */

  const handleSelectConversation = (
    conversationId: string,
  ) => {
    onSelectConversation(
      conversationId,
    );

    setSearch("");

    onClose();
  };

  /* =======================================================
     START DIRECT CHAT
  ======================================================= */

  const handleStartDirectChat = async (
    participantId: string,
  ) => {
    if (
      !participantId ||
      participantId === user?._id ||
      isCreatingDirectConversation
    ) {
      return;
    }

    try {
      const conversation =
        await createDirectConversation({
          participantId,
        }).unwrap();

      setSearch("");

      if (conversation?._id) {
        onSelectConversation(
          conversation._id,
        );

        onClose();
      }
    } catch (error) {
      console.error(
        "Failed to create direct conversation:",
        error,
      );
    }
  };

  /* =======================================================
     GROUP CREATED
  ======================================================= */

  const handleGroupCreated = (
    conversation: Conversation,
  ) => {
    setIsCreateGroupOpen(false);

    if (conversation?._id) {
      onSelectConversation(
        conversation._id,
      );

      onClose();
    }
  };

  /* =======================================================
     CURRENT USER INFO
  ======================================================= */

  const currentUserName =
    user?.name?.trim() ||
    user?.phone ||
    "User";

  const currentUserInitial =
    currentUserName
      .charAt(0)
      .toUpperCase();

  /* =======================================================
     CONVERSATION LIST
  ======================================================= */

  const conversationList =
    useMemo(() => {
      if (isSearching) {
        return [];
      }

      return conversations;
    }, [
      conversations,
      isSearching,
    ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <aside
        className={`
          absolute z-40
          flex h-full w-[320px]
          flex-col
          border-r border-slate-200
          bg-white
          transition-transform
          duration-300

          lg:relative
          lg:translate-x-0

          ${
            isOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <div
          className="
            border-b border-slate-100
            px-5 pb-4 pt-6
          "
        >
          {/* HEADER TITLE */}

          <div
            className="
              mb-5
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h1
                className="
                  text-xl
                  font-bold
                  tracking-tight
                  text-slate-900
                "
              >
                Messages
              </h1>

              <p
                className="
                  mt-1
                  text-xs
                  text-slate-400
                "
              >
                {conversations.length}{" "}
                conversations
              </p>
            </div>

            {/* CREATE GROUP */}

            <button
              type="button"
              onClick={() =>
                setIsCreateGroupOpen(
                  true,
                )
              }
              className="
                flex h-9 w-9
                items-center
                justify-center
                rounded-xl
                bg-slate-100
                text-slate-500
                transition
                hover:bg-slate-200
                hover:text-slate-700
              "
              title="Create group"
              aria-label="Create group"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* SEARCH */}

          <div className="relative">
            <Search
              size={17}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-slate-400
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Search users..."
              className="
                h-11 w-full
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                pl-10 pr-10
                text-sm
                text-slate-700
                outline-none
                transition

                placeholder:text-slate-400

                focus:border-slate-300
                focus:bg-white
                focus:ring-2
                focus:ring-slate-100
              "
            />

            {/* SEARCH LOADER */}

            {isSearching &&
              (isUsersLoading ||
                isUsersFetching) && (
                <Loader2
                  size={17}
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    animate-spin
                    text-slate-400
                  "
                />
              )}
          </div>
        </div>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <div
          className="
            flex-1
            overflow-y-auto
            px-3 py-3
          "
        >
          {/* ==================================================
              USER SEARCH RESULTS
          ================================================== */}

          {isSearching && (
            <>
              {/* SEARCH ERROR */}

              {isUsersError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-100
                    bg-red-50
                    p-4
                    text-center
                  "
                >
                  <p
                    className="
                      text-sm
                      font-medium
                      text-red-600
                    "
                  >
                    Failed to search
                    users
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-red-400
                    "
                  >
                    Please try again.
                  </p>
                </div>
              )}

              {/* USER RESULTS */}

              {!isUsersError &&
                !isUsersLoading &&
                searchUsers.length >
                  0 && (
                  <div className="space-y-1">
                    <p
                      className="
                        px-2
                        pb-2
                        text-[11px]
                        font-semibold
                        uppercase
                        tracking-wider
                        text-slate-400
                      "
                    >
                      Users
                    </p>

                    {searchUsers.map(
                      (searchUser) => {
                        const isCurrentUser =
                          searchUser._id ===
                          user?._id;

                        return (
                          <button
                            key={
                              searchUser._id
                            }
                            type="button"
                            disabled={
                              isCreatingDirectConversation ||
                              isCurrentUser
                            }
                            onClick={() =>
                              handleStartDirectChat(
                                searchUser._id,
                              )
                            }
                            className="
                              group
                              flex w-full
                              items-center
                              gap-3
                              rounded-xl
                              p-3
                              text-left
                              transition
                              hover:bg-slate-50
                              disabled:cursor-not-allowed
                              disabled:opacity-60
                            "
                          >
                            {/* USER AVATAR */}

                            <div
                              className="
                                relative
                                shrink-0
                              "
                            >
                              {searchUser.avatar ? (
                                <img
                                  src={
                                    searchUser.avatar
                                  }
                                  alt={
                                    searchUser.name
                                  }
                                  className="
                                    h-12 w-12
                                    rounded-full
                                    object-cover
                                  "
                                />
                              ) : (
                                <div
                                  className="
                                    flex
                                    h-12 w-12
                                    items-center
                                    justify-center
                                    rounded-full
                                    bg-slate-900
                                    text-sm
                                    font-bold
                                    text-white
                                  "
                                >
                                  {(
                                    searchUser.name ||
                                    searchUser.phone ||
                                    "U"
                                  )
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}

                              {/* ONLINE */}

                              {searchUser.isOnline && (
                                <span
                                  className="
                                    absolute
                                    bottom-0
                                    right-0
                                    h-3 w-3
                                    rounded-full
                                    border-2
                                    border-white
                                    bg-emerald-500
                                  "
                                />
                              )}
                            </div>

                            {/* USER INFO */}

                            <div
                              className="
                                min-w-0
                                flex-1
                              "
                            >
                              <p
                                className="
                                  truncate
                                  text-sm
                                  font-semibold
                                  text-slate-800
                                "
                              >
                                {
                                  searchUser.name
                                }
                              </p>

                              <p
                                className="
                                  mt-0.5
                                  truncate
                                  text-xs
                                  text-slate-400
                                "
                              >
                                {
                                  searchUser.phone
                                }
                              </p>
                            </div>

                            {/* ACTION */}

                            <div
                              className="
                                shrink-0
                              "
                            >
                              {isCreatingDirectConversation ? (
                                <Loader2
                                  size={17}
                                  className="
                                    animate-spin
                                    text-slate-400
                                  "
                                />
                              ) : (
                                <MessageCircle
                                  size={18}
                                  className="
                                    text-slate-300
                                    transition
                                    group-hover:text-slate-700
                                  "
                                />
                              )}
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                )}

              {/* NO USER FOUND */}

              {!isUsersError &&
                !isUsersLoading &&
                !isUsersFetching &&
                searchUsers.length ===
                  0 && (
                  <div
                    className="
                      flex h-64
                      flex-col
                      items-center
                      justify-center
                      text-center
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex h-14 w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-slate-100
                      "
                    >
                      <Search
                        size={25}
                        className="text-slate-400"
                      />
                    </div>

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      No users found
                    </p>

                    <p
                      className="
                        mt-1
                        max-w-[220px]
                        text-xs
                        text-slate-400
                      "
                    >
                      Try searching with
                      another name or phone
                      number.
                    </p>
                  </div>
                )}
            </>
          )}

          {/* ==================================================
              EXISTING CONVERSATIONS
          ================================================== */}

          {!isSearching && (
            <>
              {/* LOADING */}

              {isConversationsLoading && (
                <div className="space-y-2">
                  {[
                    1,
                    2,
                    3,
                    4,
                    5,
                    6,
                  ].map((item) => (
                    <div
                      key={item}
                      className="
                        flex
                        animate-pulse
                        items-center
                        gap-3
                        rounded-xl
                        p-3
                      "
                    >
                      <div
                        className="
                          h-12 w-12
                          rounded-full
                          bg-slate-200
                        "
                      />

                      <div
                        className="
                          flex-1
                          space-y-2
                        "
                      >
                        <div
                          className="
                            h-3 w-28
                            rounded
                            bg-slate-200
                          "
                        />

                        <div
                          className="
                            h-3 w-40
                            rounded
                            bg-slate-100
                          "
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ERROR */}

              {isConversationsError && (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-100
                    bg-red-50
                    p-4
                    text-center
                  "
                >
                  <p
                    className="
                      text-sm
                      font-medium
                      text-red-600
                    "
                  >
                    Failed to load
                    conversations
                  </p>

                  <p
                    className="
                      mt-1
                      text-xs
                      text-red-400
                    "
                  >
                    Please try again.
                  </p>
                </div>
              )}

              {/* EMPTY */}

              {!isConversationsLoading &&
                !isConversationsError &&
                conversationList.length ===
                  0 && (
                  <div
                    className="
                      flex h-64
                      flex-col
                      items-center
                      justify-center
                      text-center
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex h-14 w-14
                        items-center
                        justify-center
                        rounded-2xl
                        bg-slate-100
                      "
                    >
                      <MessageCircle
                        size={25}
                        className="text-slate-400"
                      />
                    </div>

                    <p
                      className="
                        text-sm
                        font-semibold
                        text-slate-700
                      "
                    >
                      No conversations
                    </p>

                    <p
                      className="
                        mt-1
                        max-w-[220px]
                        text-xs
                        text-slate-400
                      "
                    >
                      Search for a user
                      above to start a
                      conversation.
                    </p>
                  </div>
                )}

              {/* CONVERSATION LIST */}

              <div className="space-y-1">
                {conversationList.map(
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

                    const isGroup =
                      conversation.type ===
                      "group";

                    const isActive =
                      conversation._id ===
                      selectedConversationId;

                    const lastMessagePreview =
                      getLastMessagePreview(
                        conversation,
                      );

                    const unreadCount =
                      conversation.unreadCount ||
                      0;

                    return (
                      <button
                        key={
                          conversation._id
                        }
                        type="button"
                        onClick={() =>
                          handleSelectConversation(
                            conversation._id,
                          )
                        }
                        className={`
                          group
                          flex w-full
                          items-center
                          gap-3
                          rounded-xl
                          p-3
                          text-left
                          transition

                          ${
                            isActive
                              ? "bg-slate-100"
                              : "hover:bg-slate-50"
                          }
                        `}
                      >
                        {/* AVATAR */}

                        <div
                          className="
                            relative
                            shrink-0
                          "
                        >
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={name}
                              className="
                                h-12 w-12
                                rounded-full
                                object-cover
                              "
                            />
                          ) : isGroup ? (
                            <div
                              className="
                                flex
                                h-12 w-12
                                items-center
                                justify-center
                                rounded-full
                                bg-slate-900
                                text-white
                              "
                            >
                              <Users
                                size={20}
                              />
                            </div>
                          ) : (
                            <div
                              className="
                                flex
                                h-12 w-12
                                items-center
                                justify-center
                                rounded-full
                                bg-slate-900
                                text-sm
                                font-bold
                                text-white
                              "
                            >
                              {name
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          {/* ONLINE */}

                          {!isGroup &&
                            otherUser?.isOnline && (
                              <span
                                className="
                                  absolute
                                  bottom-0
                                  right-0
                                  h-3 w-3
                                  rounded-full
                                  border-2
                                  border-white
                                  bg-emerald-500
                                "
                              />
                            )}
                        </div>

                        {/* INFO */}

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          {/* NAME + TIME */}

                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              gap-2
                            "
                          >
                            <p
                              className={`
                                truncate
                                text-sm

                                ${
                                  unreadCount >
                                  0
                                    ? "font-bold text-slate-900"
                                    : "font-semibold text-slate-700"
                                }
                              `}
                            >
                              {name}
                            </p>

                            <span
                              className="
                                shrink-0
                                text-[10px]
                                text-slate-400
                              "
                            >
                              {formatTime(
                                conversation
                                  .lastMessage
                                  ?.createdAt,
                              )}
                            </span>
                          </div>

                          {/* LAST MESSAGE + UNREAD */}

                          <div
                            className="
                              mt-1
                              flex
                              items-center
                              justify-between
                              gap-2
                            "
                          >
                            <p
                              className={`
                                truncate
                                text-xs

                                ${
                                  unreadCount >
                                  0
                                    ? "font-medium text-slate-600"
                                    : "text-slate-400"
                                }
                              `}
                            >
                              {
                                lastMessagePreview
                              }
                            </p>

                            {/* UNREAD */}

                            {unreadCount >
                              0 && (
                              <span
                                className="
                                  flex
                                  h-5
                                  min-w-5
                                  shrink-0
                                  items-center
                                  justify-center
                                  rounded-full
                                  bg-slate-900
                                  px-1.5
                                  text-[10px]
                                  font-bold
                                  text-white
                                "
                              >
                                {unreadCount >
                                99
                                  ? "99+"
                                  : unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            </>
          )}
        </div>

        {/* ==================================================
            CURRENT USER / PROFILE
        ================================================== */}

        <div
          className="
            border-t
            border-slate-100
            p-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              rounded-xl
              bg-slate-50
              p-3
              transition
              hover:bg-slate-100
            "
          >
            {/* PROFILE */}

            <button
              type="button"
              onClick={onOpenProfile}
              className="
                flex
                min-w-0
                flex-1
                items-center
                gap-3
                rounded-lg
                text-left
                outline-none
              "
            >
              {/* AVATAR */}

              <div className="shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={
                      currentUserName
                    }
                    className="
                      h-11 w-11
                      rounded-full
                      object-cover
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-11 w-11
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-900
                      text-sm
                      font-bold
                      text-white
                    "
                  >
                    {
                      currentUserInitial
                    }
                  </div>
                )}
              </div>

              {/* USER INFO */}

              <div
                className="
                  min-w-0
                  flex-1
                "
              >
                <p
                  className="
                    truncate
                    text-sm
                    font-semibold
                    text-slate-800
                  "
                >
                  {currentUserName}
                </p>

                <div
                  className="
                    mt-0.5
                    flex
                    items-center
                    gap-1.5
                  "
                >
                  <span
                    className="
                      h-1.5 w-1.5
                      rounded-full
                      bg-emerald-500
                    "
                  />

                  <span
                    className="
                      text-[11px]
                      text-slate-400
                    "
                  >
                    Online
                  </span>
                </div>
              </div>
            </button>

            {/* MORE */}

            <button
              type="button"
              className="
                flex
                h-8 w-8
                shrink-0
                items-center
                justify-center
                rounded-lg
                text-slate-400
                transition
                hover:bg-white
                hover:text-slate-700
              "
              title="More options"
            >
              <MoreVertical
                size={17}
              />
            </button>
          </div>
        </div>
      </aside>

      {/* ==================================================
          CREATE GROUP MODAL
      ================================================== */}

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() =>
          setIsCreateGroupOpen(false)
        }
        currentUserId={user?._id}
        onCreated={
          handleGroupCreated
        }
      />
    </>
  );
}