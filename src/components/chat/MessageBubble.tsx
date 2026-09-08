"use client";

import { Check, CheckCheck, FileText, Play } from "lucide-react";

import type { Message } from "@/src/redux/features/message/message.types";

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
}

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

export default function MessageBubble({
  message,
  isMine,
}: MessageBubbleProps) {
  const sender =
    typeof message.senderId === "string"
      ? null
      : message.senderId;

  return (
    <div
      className={`flex items-end gap-2 ${
        isMine ? "justify-end" : "justify-start"
      }`}
    >
      {/* Other user's avatar */}
      {!isMine && (
        <div className="shrink-0">
          {sender?.avatar ? (
            <img
              src={sender.avatar}
              alt={sender.name || "User"}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="
                flex h-8 w-8 items-center justify-center
                rounded-full bg-slate-900
                text-[10px] font-bold text-white
              "
            >
              {sender?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
        </div>
      )}

      <div
        className={`max-w-[75%] sm:max-w-md ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        {/* Message body */}
        <div
          className={`
            overflow-hidden rounded-2xl px-4 py-3 shadow-sm
            ${
              isMine
                ? "rounded-br-md bg-slate-900 text-white"
                : "rounded-bl-md bg-slate-100 text-slate-700"
            }
          `}
        >
          {/* Deleted message */}
          {message.isDeleted ? (
            <p className="text-sm italic text-slate-400">
              This message was deleted
            </p>
          ) : (
            <>
              {/* Text */}
              {message.text && (
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.text}
                </p>
              )}

              {/* Attachments */}
              {message.attachments.map((attachment, index) => {
                const key = `${message._id}-${index}`;

                if (attachment.type === "image") {
                    return (
                    <img
                        key={key}
                        src={attachment.url}
                        alt={attachment.name || "Image"}
                        className="max-h-72 max-w-full rounded-xl object-cover"
                    />
                    );
                }

                if (attachment.type === "video") {
                    return (
                    <video
                        key={key}
                        src={attachment.url}
                        controls
                        className="max-h-72 max-w-full rounded-xl"
                    />
                    );
                }

                if (attachment.type === "audio") {
                    return (
                    <div
                        key={key}
                        className={`flex items-center gap-2 rounded-xl p-2 ${
                        isMine ? "bg-white/10" : "bg-white"
                        }`}
                    >
                        <Play size={16} className="shrink-0" />

                        <audio
                        src={attachment.url}
                        controls
                        className="max-w-[220px]"
                        />
                    </div>
                    );
                }

                return (
                    <a
                    key={key}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                        isMine
                        ? "bg-white/10 hover:bg-white/15"
                        : "bg-white hover:bg-slate-50"
                    }`}
                    >
                    <FileText size={18} />

                    <div className="min-w-0">
                        <p className="max-w-[180px] truncate text-xs font-medium">
                        {attachment.name || "Attached file"}
                        </p>

                        {attachment.size && (
                        <p className="mt-0.5 text-[10px] text-slate-400">
                            {formatFileSize(attachment.size)}
                        </p>
                        )}
                    </div>
                    </a>
                );
                })}
            </>
          )}
        </div>

        {/* Message meta */}
        <div
          className={`
            mt-1 flex items-center gap-1 px-1
            ${isMine ? "justify-end" : "justify-start"}
          `}
        >
          <span className="text-[10px] text-slate-400">
            {formatTime(message.createdAt)}
          </span>

          {message.isEdited && (
            <span className="text-[10px] text-slate-400">
              edited
            </span>
          )}

          {/* Read status */}
          {isMine &&
            (message.readBy && message.readBy.length > 1 ? (
              <CheckCheck
                size={14}
                className="text-slate-500"
              />
            ) : (
              <Check
                size={13}
                className="text-slate-400"
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function formatFileSize(bytes: number) {
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
}