 
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  CheckCheck,
  FileText,
  MoreVertical,
  Pencil,
  Reply,
  Trash2,
  X,
} from "lucide-react";

import type { Message } from "@/src/redux/features/message/message.types";
import { useDeleteMessageMutation } from "@/src/redux/features/message/messageApi";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;

  onReply?: (message: Message) => void;
  onEdit?: (message: Message) => void;
}

/* ----------------------------------
   Format Message Time
---------------------------------- */

const formatTime = (date?: string) => {
  if (!date) {
    return "";
  }

  const messageDate = new Date(date);

  if (Number.isNaN(messageDate.getTime())) {
    return "";
  }

  return messageDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ----------------------------------
   Format File Size
---------------------------------- */

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

/* ----------------------------------
   Delivery Status
---------------------------------- */

const getDeliveryStatus = (
  message: Message,
): "sent" | "delivered" | "read" => {
  const readCount = message.readBy?.length ?? 0;

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

function DeliveryStatus({
  message,
}: {
  message: Message;
}) {
  const status = getDeliveryStatus(message);

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

  if (status === "delivered") {
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
   Message Bubble
---------------------------------- */

export default function MessageBubble({
  message,
  isMine,
  onReply,
  onEdit,
}: MessageBubbleProps) {
  /* ----------------------------------
     State
  ---------------------------------- */

  const [showMenu, setShowMenu] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const [
    deleteMessage,
    { isLoading: isDeleting },
  ] = useDeleteMessageMutation();

  /* ----------------------------------
     Close menu when clicking outside
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
     Sender
  ---------------------------------- */

  const sender =
    typeof message.senderId === "string"
      ? null
      : message.senderId;

  /* ----------------------------------
     Message Content
  ---------------------------------- */

  const hasText =
    Boolean(message.text?.trim());

  const hasAttachments =
    Array.isArray(message.attachments) &&
    message.attachments.length > 0;

  /* ----------------------------------
     Delete Message
  ---------------------------------- */

  const handleDelete = async () => {
    try {
      await deleteMessage(
        String(message._id),
      ).unwrap();

      setShowDeleteConfirm(false);
      setShowMenu(false);
    } catch (error) {
      console.error(
        "Failed to delete message:",
        error,
      );
    }
  };

  /* ----------------------------------
     Reply
  ---------------------------------- */

  const handleReply = () => {
    setShowMenu(false);

    onReply?.(message);
  };

  /* ----------------------------------
     Edit
  ---------------------------------- */

  const handleEdit = () => {
    setShowMenu(false);

    onEdit?.(message);
  };

  /* ----------------------------------
     Deleted Message
  ---------------------------------- */

  const isDeleted = Boolean(
    message.isDeleted,
  );

  return (
    <div
      className={`group flex items-end gap-2 ${
        isMine
          ? "justify-end"
          : "justify-start"
      }`}
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
                sender.name || "User"
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
                .toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}

      {/* ----------------------------------
          Message Area
      ---------------------------------- */}

      <div
        className={`flex max-w-[78%] flex-col sm:max-w-md ${
          isMine
            ? "items-end"
            : "items-start"
        }`}
      >
        {/* ----------------------------------
            Message + Three Dot Menu
        ---------------------------------- */}

        <div
          className={`flex items-start gap-1 ${
            isMine
              ? "flex-row"
              : "flex-row-reverse"
          }`}
        >
          {/* ----------------------------------
              Three Dot Menu
          ---------------------------------- */}

          {isMine && !isDeleted && (
            <div
              ref={menuRef}
              className="relative shrink-0"
            >
              <button
                type="button"
                onClick={() =>
                  setShowMenu(
                    (previous) =>
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
                  Dropdown Menu
              ---------------------------------- */}

              {showMenu && (
                <div
                  className="
                    absolute
                    right-0
                    top-9
                    z-50
                    w-44
                    overflow-hidden
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    py-1
                    shadow-xl
                    dark:border-slate-700
                    dark:bg-slate-900
                  "
                >
                  {/* Reply */}

                  <button
                    type="button"
                    onClick={handleReply}
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

                  {/* Edit */}

                  <button
                    type="button"
                    onClick={handleEdit}
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

                  {/* Delete */}

                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
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
                </div>
              )}
            </div>
          )}

          {/* ----------------------------------
              Message Bubble
          ---------------------------------- */}

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
            {/* ----------------------------------
                Deleted Message
            ---------------------------------- */}

            {isDeleted ? (
              <p className="text-sm italic text-slate-400">
                This message was deleted
              </p>
            ) : (
              <div className="space-y-2">
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
                    {message.text}
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
                        const key = `${message._id}-${index}`;

                        /* Image */

                        if (
                          attachment.type ===
                          "image"
                        ) {
                          return (
                            <div
                              key={key}
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
                              key={key}
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
                              key={key}
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
                            key={key}
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
                                size={18}
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
              {/* Cancel */}

              <button
                type="button"
                disabled={isDeleting}
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

              {/* Delete */}

              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
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
                <Trash2 size={14} />

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

          {/* Delivery Status */}

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
 
