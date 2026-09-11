"use client";

import {
  Check,
  CheckCheck,
  FileText,
  Play,
} from "lucide-react";

import type { Message } from "@/src/redux/features/message/message.types";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

/* ----------------------------------
   Format Message Time
---------------------------------- */

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
   Message Delivery Status
---------------------------------- */

const getDeliveryStatus = (
  message: Message,
): "sent" | "delivered" | "read" => {
  const readCount =
    message.readBy?.length ?? 0;

  const deliveredCount =
    message.deliveredTo?.length ?? 0;

  /*
    Read / Seen
    ----------------
    If at least one recipient
    has read the message.
  */
  if (readCount > 0) {
    return "read";
  }

  /*
    Delivered
    ----------------
    Message reached at least
    one recipient.
  */
  if (deliveredCount > 0) {
    return "delivered";
  }

  /*
    Sent
    ----------------
    Message was sent but has
    not been delivered yet.
  */
  return "sent";
};

/* ----------------------------------
   Delivery Status Icon
---------------------------------- */

function DeliveryStatus({
  message,
}: {
  message: Message;
}) {
  const status =
    getDeliveryStatus(message);

  /*
    READ
    Blue double check
  */
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

  /*
    DELIVERED
    Gray double check
  */
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

  /*
    SENT
    Single check
  */
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
}: MessageBubbleProps) {
  const sender =
    typeof message.senderId === "string"
      ? null
      : message.senderId;

  const hasText =
    Boolean(message.text?.trim());

  const hasAttachments =
    message.attachments &&
    message.attachments.length > 0;

  return (
    <div
      className={`flex items-end gap-2 ${
        isMine
          ? "justify-end"
          : "justify-start"
      }`}
    >
      {/* --------------------------------
          Other User Avatar
      -------------------------------- */}

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

      {/* --------------------------------
          Message Content
      -------------------------------- */}

      <div
        className={`flex max-w-[78%] flex-col sm:max-w-md ${
          isMine
            ? "items-end"
            : "items-start"
        }`}
      >
        {/* --------------------------------
            Bubble
        -------------------------------- */}

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
          {/* --------------------------------
              Deleted Message
          -------------------------------- */}

          {message.isDeleted ? (
            <p className="text-sm italic text-slate-400">
              This message was deleted
            </p>
          ) : (
            <div className="space-y-2">
              {/* --------------------------------
                  Text
              -------------------------------- */}

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

              {/* --------------------------------
                  Attachments
              -------------------------------- */}

              {hasAttachments && (
                <div className="space-y-2">
                  {message.attachments.map(
                    (
                      attachment,
                      index,
                    ) => {
                      const key = `${message._id}-${index}`;

                      /* ---------------------------
                         Image
                      --------------------------- */

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
                              className="
                                max-h-80
                                max-w-full
                                rounded-xl
                                object-cover
                              "
                              loading="lazy"
                            />
                          </div>
                        );
                      }

                      /* ---------------------------
                         Video
                      --------------------------- */

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

                      /* ---------------------------
                         Audio / Voice Message
                      --------------------------- */

                      if (
                        attachment.type ===
                        "audio"
                      ) {
                        return (
                          <div
                            key={key}
                            className={`
                              flex
                              items-center
                              gap-2
                              rounded-xl
                              p-2
                              ${
                                isMine
                                  ? "bg-white/10"
                                  : "bg-white"
                              }
                            `}
                          >
                            <div
                              className={`
                                flex
                                h-8
                                w-8
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                ${
                                  isMine
                                    ? "bg-white/10"
                                    : "bg-slate-100"
                                }
                              `}
                            >
                              <Play
                                size={15}
                                fill="currentColor"
                              />
                            </div>

                            <audio
                              src={
                                attachment.url
                              }
                              controls
                              preload="metadata"
                              className="
                                h-9
                                max-w-[220px]
                              "
                            />
                          </div>
                        );
                      }

                      /* ---------------------------
                         File / Document
                      --------------------------- */

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
                          {/* File Icon */}

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

                          {/* File Info */}

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
                                className={`
                                  mt-0.5
                                  text-[10px]
                                  text-slate-400
                                `}
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

        {/* --------------------------------
            Message Meta
        -------------------------------- */}

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

          {/* --------------------------------
              Delivery / Read Status
          -------------------------------- */}

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