"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Check,
  CheckCheck,
  FileText,
  MoreVertical,
  Pencil,
  Reply,
  Trash2,
  X,
  Save,
} from "lucide-react";

import type { Message } from "@/src/redux/features/message/message.types";

/* ----------------------------------
   Props
---------------------------------- */

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;

  onReply?: (
    message: Message,
  ) => void;

  onEdit?: (
    messageId: string,
    text: string,
  ) => boolean;

  onDelete?: (
    messageId: string,
  ) => boolean;

  onReaction?: (
    messageId: string,
    emoji: string,
  ) => boolean;
}

/* ----------------------------------
   Format Message Time
---------------------------------- */

const formatTime = (
  date?: string,
) => {
  if (!date) {
    return "";
  }

  const messageDate =
    new Date(date);

  if (
    Number.isNaN(
      messageDate.getTime(),
    )
  ) {
    return "";
  }

  return messageDate.toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
};

/* ----------------------------------
   Format File Size
---------------------------------- */

const formatFileSize = (
  bytes: number,
) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  if (
    bytes <
    1024 *
      1024 *
      1024
  ) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 *
      1024 *
      1024)
  ).toFixed(1)} GB`;
};

/* ----------------------------------
   Delivery Status
---------------------------------- */

const getDeliveryStatus = (
  message: Message,
):
  | "sent"
  | "delivered"
  | "read" => {
  const readCount =
    message.readBy?.length ?? 0;

  const deliveredCount =
    message.deliveredTo?.length ?? 0;

  if (readCount > 0) {
    return "read";
  }

  if (deliveredCount > 0) {
    return "delivered";
  }

  return "sent";
};

/* ----------------------------------
   Delivery Status Component
---------------------------------- */

function DeliveryStatus({
  message,
}: {
  message: Message;
}) {
  const status =
    getDeliveryStatus(message);

  if (status === "read") {
    return (
      <CheckCheck
        size={14}
        strokeWidth={2.5}
        className="text-sky-500"
        aria-label="Read"
      />
    );
  }

  if (
    status === "delivered"
  ) {
    return (
      <CheckCheck
        size={14}
        strokeWidth={2.5}
        className="text-slate-400"
        aria-label="Delivered"
      />
    );
  }

  return (
    <Check
      size={13}
      strokeWidth={2.5}
      className="text-slate-400"
      aria-label="Sent"
    />
  );
}

/* ----------------------------------
   Reaction User
---------------------------------- */

interface ReactionUser {
  userId: string;
  name: string;
}

/* ----------------------------------
   Backend Reaction Summary
---------------------------------- */

interface ReactionSummary {
  emoji: string;
  count: number;
  users: ReactionUser[];
}

/* ----------------------------------
   Legacy / Raw Reaction
---------------------------------- */

interface RawMessageReaction {
  userId:
    | string
    | {
        _id?: string;
        name?: string;
        phone?: string;
      };

  emoji: string;

  createdAt?: string;
}

/* ----------------------------------
   Normalized Reaction
---------------------------------- */

interface NormalizedReaction {
  emoji: string;

  count: number;

  users: ReactionUser[];
}

/* ----------------------------------
   Get User ID
---------------------------------- */

const getReactionUserId = (
  userId:
    | string
    | {
        _id?: string;
        name?: string;
        phone?: string;
      },
): string | undefined => {
  if (
    typeof userId === "string"
  ) {
    return userId;
  }

  return userId?._id;
};

/* ----------------------------------
   Get User Name
---------------------------------- */

const getReactionUserName = (
  userId:
    | string
    | {
        _id?: string;
        name?: string;
        phone?: string;
      },
): string => {
  if (
    typeof userId === "string"
  ) {
    return "User";
  }

  return (
    userId?.name?.trim() ||
    userId?.phone ||
    "User"
  );
};

/* ----------------------------------
   Normalize Reactions
---------------------------------- */

const normalizeReactions = (
  value: unknown,
): NormalizedReaction[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  /*
   * New backend structure:
   *
   * {
   *   emoji: "❤️",
   *   count: 2,
   *   users: [
   *     {
   *       userId: "...",
   *       name: "Aminul"
   *     }
   *   ]
   * }
   */

  const isSummary =
    (
      item: unknown,
    ): item is ReactionSummary => {
      if (
        typeof item !==
          "object" ||
        item === null
      ) {
        return false;
      }

      const reaction =
        item as Record<
          string,
          unknown
        >;

      return (
        typeof reaction.emoji ===
          "string" &&
        typeof reaction.count ===
          "number" &&
        Array.isArray(
          reaction.users,
        )
      );
    };

  const summaryReactions =
    value.filter(isSummary);

  if (
    summaryReactions.length ===
    value.length
  ) {
    return summaryReactions.map(
      (reaction) => ({
        emoji:
          reaction.emoji,

        count:
          reaction.count,

        users:
          reaction.users.map(
            (user) => ({
              userId:
                String(
                  user.userId,
                ),

              name:
                user.name ||
                "User",
            }),
          ),
      }),
    );
  }

  /*
   * Legacy/raw structure
   */

  const rawReactions =
    value as RawMessageReaction[];

  const grouped =
    new Map<
      string,
      NormalizedReaction
    >();

  for (
    const reaction of rawReactions
  ) {
    if (
      !reaction ||
      !reaction.emoji
    ) {
      continue;
    }

    const emoji =
      reaction.emoji;

    const userId =
      getReactionUserId(
        reaction.userId,
      );

    const name =
      getReactionUserName(
        reaction.userId,
      );

    const existing =
      grouped.get(emoji);

    if (existing) {
      existing.count += 1;

      existing.users.push({
        userId:
          userId ??
          `unknown-${existing.users.length}`,

        name,
      });
    } else {
      grouped.set(emoji, {
        emoji,

        count: 1,

        users: [
          {
            userId:
              userId ??
              "unknown",

            name,
          },
        ],
      });
    }
  }

  return Array.from(
    grouped.values(),
  );
};

/* ----------------------------------
   Common Emojis
---------------------------------- */

const reactionEmojis = [
  "❤️",
  "😂",
  "👍",
  "😮",
  "😢",
  "🙏",
];

/* ----------------------------------
   Message Bubble
---------------------------------- */

export default function MessageBubble({
  message,
  isMine,
  onReply,
  onEdit,
  onDelete,
  onReaction,
}: MessageBubbleProps) {
  /* ----------------------------------
     Menu State
  ---------------------------------- */

  const [showMenu, setShowMenu] =
    useState(false);

  /* ----------------------------------
     Reaction Loading
  ---------------------------------- */

  const [
    reactingEmoji,
    setReactingEmoji,
  ] = useState<string | null>(
    null,
  );

  /* ----------------------------------
     Delete State
  ---------------------------------- */

  const [
    showDeleteConfirm,
    setShowDeleteConfirm,
  ] = useState(false);

  const [
    isDeleting,
    setIsDeleting,
  ] = useState(false);

  /* ----------------------------------
     Edit State
  ---------------------------------- */

  const [
    isEditing,
    setIsEditing,
  ] = useState(false);

  const [
    editText,
    setEditText,
  ] = useState(
    message.text ?? "",
  );

  const [
    isSavingEdit,
    setIsSavingEdit,
  ] = useState(false);

  /* ----------------------------------
     Refs
  ---------------------------------- */

  const menuRef =
    useRef<HTMLDivElement>(null);

  const editTextareaRef =
    useRef<HTMLTextAreaElement>(
      null,
    );

  /* ----------------------------------
     Message State
  ---------------------------------- */

  const isDeleted =
    Boolean(message.isDeleted);

  /* ----------------------------------
     Normalized Reactions
  ---------------------------------- */

  const normalizedReactions =
    normalizeReactions(
      message.reactions,
    );

  /* ----------------------------------
     Close Menu Outside
  ---------------------------------- */

  useEffect(() => {
    const handleClickOutside = (
      event: MouseEvent,
    ) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node,
        )
      ) {
        setShowMenu(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  /* ----------------------------------
     Sync Edit Text
  ---------------------------------- */

  useEffect(() => {
    if (!isEditing) {
      setEditText(
        message.text ?? "",
      );
    }
  }, [
    message.text,
    isEditing,
  ]);

  /* ----------------------------------
     Focus Edit Textarea
  ---------------------------------- */

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    const textarea =
      editTextareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.focus();

    textarea.setSelectionRange(
      textarea.value.length,
      textarea.value.length,
    );
  }, [isEditing]);

  /* ----------------------------------
     Sender
  ---------------------------------- */

  const sender =
    typeof message.senderId ===
    "string"
      ? null
      : message.senderId;

  /* ----------------------------------
     Message Content
  ---------------------------------- */

  const hasText =
    Boolean(
      message.text?.trim(),
    );

  const hasAttachments =
    Array.isArray(
      message.attachments,
    ) &&
    message.attachments.length >
      0;

  /* ----------------------------------
     Reply
  ---------------------------------- */

  const repliedMessage =
    message.replyTo &&
    typeof message.replyTo !==
      "string"
      ? message.replyTo
      : null;

  const repliedSender =
    repliedMessage &&
    typeof repliedMessage.senderId !==
      "string"
      ? repliedMessage.senderId
      : null;

  const repliedMessageText =
    repliedMessage?.isDeleted
      ? "This message was deleted"
      : repliedMessage?.text?.trim()
        ? repliedMessage.text
        : repliedMessage
              ?.attachments
              ?.length
          ? "Attachment"
          : repliedMessage
            ? "Message"
            : "";

  /* ----------------------------------
     Reaction Handler
  ---------------------------------- */

  const handleReaction = (
    emoji: string,
  ) => {
    if (!onReaction) {
      console.error(
        "Reaction handler is not available.",
      );

      return;
    }

    if (isDeleted) {
      return;
    }

    if (!emoji) {
      return;
    }

    if (reactingEmoji !== null) {
      return;
    }

    setReactingEmoji(emoji);

    try {
      const success =
        onReaction(
          String(message._id),
          emoji,
        );

      if (success) {
        setShowMenu(false);
      }
    } catch (error) {
      console.error(
        "Reaction error:",
        error,
      );
    } finally {
      setReactingEmoji(null);
    }
  };

  /* ----------------------------------
     Reply Handler
  ---------------------------------- */

  const handleReply = () => {
    setShowMenu(false);

    onReply?.(message);
  };

  /* ----------------------------------
     Edit Handler
  ---------------------------------- */

  const handleEdit = () => {
    if (!isMine) {
      return;
    }

    if (isDeleted) {
      return;
    }

    if (!onEdit) {
      console.error(
        "Edit handler is not available.",
      );

      return;
    }

    setShowMenu(false);

    setShowDeleteConfirm(
      false,
    );

    setEditText(
      message.text ?? "",
    );

    setIsEditing(true);
  };

  /* ----------------------------------
     Cancel Edit
  ---------------------------------- */

  const handleCancelEdit =
    () => {
      if (isSavingEdit) {
        return;
      }

      setEditText(
        message.text ?? "",
      );

      setIsEditing(false);
    };

  /* ----------------------------------
     Save Edit
  ---------------------------------- */

  const handleSaveEdit = () => {
    if (isSavingEdit) {
      return;
    }

    if (!onEdit) {
      console.error(
        "Edit handler is not available.",
      );

      return;
    }

    if (isDeleted) {
      return;
    }

    const trimmedText =
      editText.trim();

    if (!trimmedText) {
      return;
    }

    if (
      trimmedText ===
      (
        message.text ??
        ""
      ).trim()
    ) {
      setIsEditing(false);

      return;
    }

    setIsSavingEdit(true);

    try {
      const success =
        onEdit(
          String(message._id),
          trimmedText,
        );

      if (success) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error(
        "Edit message error:",
        error,
      );
    } finally {
      setIsSavingEdit(false);
    }
  };

  /* ----------------------------------
     Edit Keyboard Handler
  ---------------------------------- */

  const handleEditKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key ===
      "Escape"
    ) {
      event.preventDefault();

      handleCancelEdit();

      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSaveEdit();
    }
  };

  /* ----------------------------------
     Delete Handler
  ---------------------------------- */

  const handleDelete = () => {
    if (!onDelete) {
      console.error(
        "Delete handler is not available.",
      );

      return;
    }

    if (isDeleted) {
      return;
    }

    setIsDeleting(true);

    const emitted =
      onDelete(
        String(message._id),
      );

    if (!emitted) {
      setIsDeleting(false);

      return;
    }

    setShowDeleteConfirm(
      false,
    );

    setShowMenu(false);

    setIsDeleting(false);
  };

  /* ----------------------------------
     Render
  ---------------------------------- */

  return (
    <div
      className={`
        group
        flex
        items-end
        gap-2
        ${
          isMine
            ? "justify-end"
            : "justify-start"
        }
      `}
    >
      {/* ----------------------------------
          Receiver Avatar
      ---------------------------------- */}

      {!isMine && (
        <div className="shrink-0">
          {sender?.avatar ? (
            <img
              src={sender.avatar}
              alt={
                sender.name ||
                "User"
              }
              className="
                h-8
                w-8
                rounded-full
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-slate-900
                text-[10px]
                font-bold
                text-white
              "
            >
              {sender?.name
                ?.charAt(0)
                .toUpperCase() ||
                "U"}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------
          Message Area
      ---------------------------------- */}

      <div
        className={`
          flex
          max-w-[78%]
          flex-col
          sm:max-w-md
          ${
            isMine
              ? "items-end"
              : "items-start"
          }
        `}
      >
        {/* ----------------------------------
            Message + Menu
        ---------------------------------- */}

        <div
          className={`
            flex
            items-start
            gap-1
            ${
              isMine
                ? "flex-row-reverse"
                : "flex-row"
            }
          `}
        >
          {/* ----------------------------------
              Message Bubble
          ---------------------------------- */}

          {isEditing ? (
            <div
              className="
                min-w-[240px]
                max-w-md
                rounded-2xl
                rounded-br-md
                bg-slate-900
                p-3
                text-white
                shadow-sm
              "
            >
              <textarea
                ref={
                  editTextareaRef
                }
                value={editText}
                onChange={(
                  event,
                ) =>
                  setEditText(
                    event.target.value,
                  )
                }
                onKeyDown={
                  handleEditKeyDown
                }
                disabled={
                  isSavingEdit
                }
                rows={3}
                className="
                  w-full
                  resize-none
                  rounded-xl
                  border
                  border-white/20
                  bg-white/10
                  px-3
                  py-2
                  text-sm
                  leading-6
                  text-white
                  outline-none
                  placeholder:text-white/40
                  focus:border-white/40
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
                placeholder="Edit message..."
              />

              {/* Edit Actions */}

              <div
                className="
                  mt-2
                  flex
                  items-center
                  justify-end
                  gap-2
                "
              >
                <button
                  type="button"
                  onClick={
                    handleCancelEdit
                  }
                  disabled={
                    isSavingEdit
                  }
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-lg
                    px-3
                    py-1.5
                    text-xs
                    font-medium
                    text-white/70
                    transition
                    hover:bg-white/10
                    hover:text-white
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <X size={14} />

                  Cancel
                </button>

                <button
                  type="button"
                  onClick={
                    handleSaveEdit
                  }
                  disabled={
                    isSavingEdit ||
                    !editText.trim()
                  }
                  className="
                    flex
                    items-center
                    gap-1.5
                    rounded-lg
                    bg-white
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    text-slate-900
                    transition
                    hover:bg-slate-100
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  <Save size={14} />

                  {isSavingEdit
                    ? "Saving..."
                    : "Save"}
                </button>
              </div>

              <p
                className="
                  mt-2
                  text-right
                  text-[10px]
                  text-white/40
                "
              >
                Enter to save ·
                Shift+Enter for
                new line · Esc to
                cancel
              </p>
            </div>
          ) : (
            <div className="relative">
              <div
                className={`
                  overflow-hidden
                  rounded-2xl
                  px-4
                  py-3
                  shadow-sm
                  ${
                    isMine
                      ? `
                        rounded-br-md
                        bg-slate-900
                        text-white
                      `
                      : `
                        rounded-bl-md
                        bg-slate-100
                        text-slate-700
                      `
                  }
                `}
              >
                {/* Deleted */}

                {isDeleted ? (
                  <p className="text-sm italic text-slate-400">
                    This message was
                    deleted
                  </p>
                ) : (
                  <div className="space-y-2">
                    {/* ----------------------------------
                        QUOTED REPLY
                    ---------------------------------- */}

                    {repliedMessage && (
                      <div
                        className={`
                          rounded-lg
                          border-l-4
                          px-3
                          py-2
                          ${
                            isMine
                              ? `
                                border-white/60
                                bg-white/10
                              `
                              : `
                                border-slate-400
                                bg-white
                              `
                          }
                        `}
                      >
                        <p
                          className={`
                            truncate
                            text-[11px]
                            font-semibold
                            ${
                              isMine
                                ? "text-white"
                                : "text-slate-700"
                            }
                          `}
                        >
                          {repliedSender?.name ||
                            "User"}
                        </p>

                        <p
                          className={`
                            mt-0.5
                            truncate
                            text-xs
                            ${
                              isMine
                                ? "text-white/70"
                                : "text-slate-500"
                            }
                          `}
                          title={
                            repliedMessageText
                          }
                        >
                          {
                            repliedMessageText
                          }
                        </p>
                      </div>
                    )}

                    {/* ----------------------------------
                        Text
                    ---------------------------------- */}

                    {hasText && (
                      <p
                        className="
                          whitespace-pre-wrap
                          break-words
                          text-sm
                          leading-6
                        "
                      >
                        {
                          message.text
                        }
                      </p>
                    )}

                    {/* ----------------------------------
                        Attachments
                    ---------------------------------- */}

                    {hasAttachments && (
                      <div className="space-y-2">
                        {message.attachments.map(
                          (
                            attachment,
                            index,
                          ) => {
                            const key =
                              `${message._id}-${index}`;

                            /* Image */

                            if (
                              attachment.type ===
                              "image"
                            ) {
                              return (
                                <div
                                  key={
                                    key
                                  }
                                  className="
                                    overflow-hidden
                                    rounded-xl
                                  "
                                >
                                  <img
                                    src={
                                      attachment.url
                                    }
                                    alt={
                                      attachment.name ||
                                      "Image"
                                    }
                                    loading="lazy"
                                    className="
                                      max-h-80
                                      max-w-full
                                      rounded-xl
                                      object-cover
                                    "
                                  />
                                </div>
                              );
                            }

                            /* Video */

                            if (
                              attachment.type ===
                              "video"
                            ) {
                              return (
                                <div
                                  key={
                                    key
                                  }
                                  className="
                                    overflow-hidden
                                    rounded-xl
                                  "
                                >
                                  <video
                                    src={
                                      attachment.url
                                    }
                                    controls
                                    preload="metadata"
                                    className="
                                      max-h-80
                                      max-w-full
                                      rounded-xl
                                    "
                                  />
                                </div>
                              );
                            }

                            /* Audio */

                            if (
                              attachment.type ===
                              "audio"
                            ) {
                              return (
                                <div
                                  key={
                                    key
                                  }
                                  className={`
                                    rounded-xl
                                    p-2
                                    ${
                                      isMine
                                        ? "bg-white/10"
                                        : "bg-white"
                                    }
                                  `}
                                >
                                  <audio
                                    src={
                                      attachment.url
                                    }
                                    controls
                                    preload="metadata"
                                    className="
                                      h-9
                                      max-w-[260px]
                                    "
                                  />
                                </div>
                              );
                            }

                            /* File */

                            return (
                              <a
                                key={
                                  key
                                }
                                href={
                                  attachment.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`
                                  flex
                                  min-w-0
                                  items-center
                                  gap-3
                                  rounded-xl
                                  p-3
                                  transition
                                  ${
                                    isMine
                                      ? `
                                        bg-white/10
                                        hover:bg-white/15
                                      `
                                      : `
                                        bg-white
                                        hover:bg-slate-50
                                      `
                                  }
                                `}
                              >
                                <div
                                  className={`
                                    flex
                                    h-9
                                    w-9
                                    shrink-0
                                    items-center
                                    justify-center
                                    rounded-lg
                                    ${
                                      isMine
                                        ? "bg-white/10"
                                        : "bg-slate-100"
                                    }
                                  `}
                                >
                                  <FileText
                                    size={
                                      18
                                    }
                                  />
                                </div>

                                <div className="min-w-0">
                                  <p
                                    className="
                                      max-w-[180px]
                                      truncate
                                      text-xs
                                      font-medium
                                    "
                                  >
                                    {attachment.name ||
                                      "Attached file"}
                                  </p>

                                  {typeof attachment.size ===
                                    "number" && (
                                    <p
                                      className="
                                        mt-0.5
                                        text-[10px]
                                        text-slate-400
                                      "
                                    >
                                      {formatFileSize(
                                        attachment.size,
                                      )}
                                    </p>
                                  )}
                                </div>
                              </a>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ----------------------------------
                  REACTIONS
              ---------------------------------- */}

              {!isDeleted &&
                normalizedReactions.length >
                  0 && (
                  <div
                    className="
                      absolute
                      -bottom-4
                      right-2
                      z-20
                      flex
                      max-w-[90%]
                      flex-wrap
                      gap-1
                    "
                  >
                    {normalizedReactions.map(
                      (
                        reaction,
                      ) => (
                        <div
                          key={
                            reaction.emoji
                          }
                          className="
                            group/reaction
                            relative
                          "
                        >
                          {/* Reaction Chip */}

                          <button
                            type="button"
                            onClick={() =>
                              handleReaction(
                                reaction.emoji,
                              )
                            }
                            disabled={
                              reactingEmoji !==
                              null
                            }
                            className="
                              flex
                              h-7
                              items-center
                              gap-1
                              rounded-full
                              border
                              border-slate-200
                              bg-white
                              px-2
                              text-xs
                              shadow-sm
                              transition
                              hover:-translate-y-0.5
                              hover:border-slate-300
                              hover:shadow-md
                              disabled:cursor-not-allowed
                              disabled:opacity-60
                              dark:border-slate-700
                              dark:bg-slate-800
                            "
                            aria-label={`React with ${reaction.emoji}`}
                          >
                            <span className="text-base leading-none">
                              {
                                reaction.emoji
                              }
                            </span>

                            {reaction.count >
                              1 && (
                              <span
                                className="
                                  text-[10px]
                                  font-semibold
                                  text-slate-500
                                  dark:text-slate-300
                                "
                              >
                                {
                                  reaction.count
                                }
                              </span>
                            )}
                          </button>

                          {/* User Names Tooltip */}

                          <div
                            className="
                              pointer-events-none
                              absolute
                              bottom-full
                              left-1/2
                              z-50
                              mb-2
                              hidden
                              -translate-x-1/2
                              whitespace-nowrap
                              rounded-lg
                              bg-slate-900
                              px-3
                              py-2
                              text-xs
                              text-white
                              shadow-xl
                              group-hover/reaction:block
                              dark:bg-black
                            "
                          >
                            <div className="flex flex-col gap-1">
                              {reaction.users.map(
                                (
                                  user,
                                  index,
                                ) => (
                                  <span
                                    key={`${reaction.emoji}-${user.userId}-${index}`}
                                  >
                                    {
                                      user.name
                                    }
                                  </span>
                                ),
                              )}
                            </div>

                            {/* Tooltip Arrow */}

                            <div
                              className="
                                absolute
                                left-1/2
                                top-full
                                -translate-x-1/2
                                border-4
                                border-transparent
                                border-t-slate-900
                                dark:border-t-black
                              "
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          )}

          {/* ----------------------------------
              Three Dot Menu
          ---------------------------------- */}

          {!isDeleted &&
            !isEditing && (
              <div
                ref={menuRef}
                className="
                  relative
                  shrink-0
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    setShowMenu(
                      (
                        previous,
                      ) =>
                        !previous,
                    )
                  }
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    text-slate-400
                    opacity-0
                    transition
                    hover:bg-slate-100
                    hover:text-slate-700
                    group-hover:opacity-100
                    focus:opacity-100
                    dark:hover:bg-slate-800
                    dark:hover:text-slate-200
                  "
                  aria-label="Message options"
                >
                  <MoreVertical
                    size={18}
                  />
                </button>

                {/* ----------------------------------
                    Dropdown
                ---------------------------------- */}

                {showMenu && (
                  <div
                    className={`
                      absolute
                      top-9
                      z-50
                      w-52
                      overflow-hidden
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      py-1.5
                      shadow-xl
                      dark:border-slate-700
                      dark:bg-slate-900
                      ${
                        isMine
                          ? "right-0"
                          : "left-0"
                      }
                    `}
                  >
                    {/* ----------------------------------
                        Reaction Picker
                    ---------------------------------- */}

                    {onReaction && (
                      <>
                        <div
                          className="
                            px-3
                            pb-2
                            pt-2
                          "
                        >
                          <p
                            className="
                              mb-2
                              text-[10px]
                              font-medium
                              uppercase
                              tracking-wide
                              text-slate-400
                            "
                          >
                            React
                          </p>

                          <div
                            className="
                              flex
                              items-center
                              justify-between
                              rounded-lg
                              bg-slate-50
                              px-1.5
                              py-1.5
                              dark:bg-slate-800
                            "
                          >
                            {reactionEmojis.map(
                              (
                                emoji,
                              ) => (
                                <button
                                  key={
                                    emoji
                                  }
                                  type="button"
                                  onClick={() =>
                                    handleReaction(
                                      emoji,
                                    )
                                  }
                                  disabled={
                                    reactingEmoji !==
                                    null
                                  }
                                  className="
                                    flex
                                    h-8
                                    w-8
                                    items-center
                                    justify-center
                                    rounded-full
                                    text-lg
                                    transition
                                    hover:scale-125
                                    hover:bg-white
                                    disabled:cursor-not-allowed
                                    disabled:opacity-60
                                    dark:hover:bg-slate-700
                                  "
                                  aria-label={`React with ${emoji}`}
                                >
                                  {
                                    emoji
                                  }
                                </button>
                              ),
                            )}
                          </div>
                        </div>

                        <div
                          className="
                            mx-3
                            border-t
                            border-slate-200
                            dark:border-slate-700
                          "
                        />
                      </>
                    )}

                    {/* ----------------------------------
                        Reply
                    ---------------------------------- */}

                    <button
                      type="button"
                      onClick={
                        handleReply
                      }
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        px-4
                        py-2.5
                        text-left
                        text-sm
                        text-slate-700
                        transition
                        hover:bg-slate-100
                        dark:text-slate-200
                        dark:hover:bg-slate-800
                      "
                    >
                      <Reply
                        size={16}
                      />

                      <span>
                        Reply
                      </span>
                    </button>

                    {/* ----------------------------------
                        Edit
                    ---------------------------------- */}

                    {isMine && (
                      <button
                        type="button"
                        onClick={
                          handleEdit
                        }
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-4
                          py-2.5
                          text-left
                          text-sm
                          text-slate-700
                          transition
                          hover:bg-slate-100
                          dark:text-slate-200
                          dark:hover:bg-slate-800
                        "
                      >
                        <Pencil
                          size={16}
                        />

                        <span>
                          Edit message
                        </span>
                      </button>
                    )}

                    {/* ----------------------------------
                        Delete
                    ---------------------------------- */}

                    {isMine && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(
                            false,
                          );

                          setShowDeleteConfirm(
                            true,
                          );
                        }}
                        className="
                          flex
                          w-full
                          items-center
                          gap-3
                          px-4
                          py-2.5
                          text-left
                          text-sm
                          text-red-600
                          transition
                          hover:bg-red-50
                          dark:text-red-400
                          dark:hover:bg-red-950/30
                        "
                      >
                        <Trash2
                          size={16}
                        />

                        <span>
                          Delete
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>

        {/* ----------------------------------
            Delete Confirmation
        ---------------------------------- */}

        {showDeleteConfirm && (
          <div
            className="
              mt-2
              w-full
              max-w-xs
              rounded-xl
              border
              border-red-200
              bg-white
              p-3
              shadow-lg
              dark:border-red-900
              dark:bg-slate-900
            "
          >
            <div className="flex items-start gap-3">
              <div
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-red-100
                  text-red-600
                  dark:bg-red-950
                  dark:text-red-400
                "
              >
                <Trash2
                  size={17}
                />
              </div>

              <div className="min-w-0">
                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                    dark:text-slate-100
                  "
                >
                  Delete message?
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-500
                    dark:text-slate-400
                  "
                >
                  This message will be
                  removed from the chat.
                </p>
              </div>
            </div>

            {/* Confirmation Buttons */}

            <div
              className="
                mt-3
                flex
                items-center
                justify-end
                gap-2
              "
            >
              <button
                type="button"
                disabled={
                  isDeleting
                }
                onClick={() =>
                  setShowDeleteConfirm(
                    false,
                  )
                }
                className="
                  flex
                  items-center
                  gap-1.5
                  rounded-lg
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-slate-600
                  transition
                  hover:bg-slate-100
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                  dark:text-slate-300
                  dark:hover:bg-slate-800
                "
              >
                <X size={14} />

                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isDeleting
                }
                onClick={
                  handleDelete
                }
                className="
                  flex
                  items-center
                  gap-1.5
                  rounded-lg
                  bg-red-600
                  px-3
                  py-1.5
                  text-xs
                  font-medium
                  text-white
                  transition
                  hover:bg-red-700
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <Trash2
                  size={14}
                />

                {isDeleting
                  ? "Deleting..."
                  : "Delete"}
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------
            Message Meta
        ---------------------------------- */}

        <div
          className={`
            mt-1
            flex
            items-center
            gap-1
            px-1
            ${
              isMine
                ? "justify-end"
                : "justify-start"
            }
          `}
        >
          {/* Time */}

          <span className="text-[10px] text-slate-400">
            {formatTime(
              message.createdAt,
            )}
          </span>

          {/* Edited */}

          {message.isEdited &&
            !message.isDeleted && (
              <span className="text-[10px] text-slate-400">
                edited
              </span>
            )}

          {/* Delivery */}

          {isMine && (
            <DeliveryStatus
              message={message}
            />
          )}
        </div>
      </div>
    </div>
  );
}