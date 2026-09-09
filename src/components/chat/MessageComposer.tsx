"use client";

import {
  Paperclip,
  Send,
  Smile,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";

interface MessageComposerProps {
  onSend?: (message: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
  disabled?: boolean;
}

export default function MessageComposer({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
}: MessageComposerProps) {
  const [message, setMessage] = useState("");

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const typingTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    );

  // =========================
  // CLEANUP TYPING TIMEOUT
  // =========================

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current,
        );
      }
    };
  }, []);

  // =========================
  // SEND MESSAGE
  // =========================

  const handleSend = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || disabled) {
      return;
    }

    // Stop typing
    onTypingStop?.();

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current,
      );
    }

    onSend?.(trimmedMessage);

    setMessage("");
  };

  // =========================
  // HANDLE INPUT
  // =========================

  const handleMessageChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const value = event.target.value;

    setMessage(value);

    // Empty input
    if (!value.trim()) {
      onTypingStop?.();

      if (typingTimeoutRef.current) {
        clearTimeout(
          typingTimeoutRef.current,
        );
      }

      return;
    }

    // User started typing
    onTypingStart?.();

    // Reset previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(
        typingTimeoutRef.current,
      );
    }

    // Stop typing after 1 second
    typingTimeoutRef.current =
      setTimeout(() => {
        onTypingStop?.();
      }, 1000);
  };

  // =========================
  // KEYBOARD
  // =========================

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSend();
    }
  };

  // =========================
  // ATTACHMENT
  // =========================

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;

    if (!files || files.length === 0) {
      return;
    }

    console.log(
      "Selected files:",
      files,
    );

    // File upload logic পরে এখানে connect করবো

    event.target.value = "";
  };

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4">
      <div className="mx-auto flex max-w-4xl items-end gap-2">
        {/* ================= ATTACHMENT ================= */}

        <button
          type="button"
          onClick={handleAttachmentClick}
          disabled={disabled}
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-full
            text-slate-500
            transition
            hover:bg-slate-100
            hover:text-slate-700
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
          title="Attach file"
        >
          <Paperclip size={20} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ================= MESSAGE INPUT ================= */}

        <div
          className="
            flex min-h-10 flex-1
            items-end
            rounded-2xl
            border border-slate-200
            bg-slate-50
            px-3 py-2
            transition
            focus-within:border-slate-300
            focus-within:bg-white
          "
        >
          <textarea
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            rows={1}
            placeholder="Type a message..."
            className="
              max-h-32
              min-h-6
              flex-1
              resize-none
              bg-transparent
              px-1
              text-sm
              text-slate-800
              outline-none
              placeholder:text-slate-400
              disabled:cursor-not-allowed
            "
          />

          {/* ================= EMOJI ================= */}

          <button
            type="button"
            disabled={disabled}
            className="
              ml-1
              flex h-7 w-7 shrink-0
              items-center justify-center
              rounded-full
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-600
              disabled:opacity-50
            "
            title="Emoji"
          >
            <Smile size={19} />
          </button>
        </div>

        {/* ================= SEND ================= */}

        <button
          type="button"
          onClick={handleSend}
          disabled={
            disabled || !message.trim()
          }
          className="
            flex h-10 w-10 shrink-0
            items-center justify-center
            rounded-full
            bg-slate-900
            text-white
            transition
            hover:bg-slate-800
            disabled:cursor-not-allowed
            disabled:bg-slate-200
            disabled:text-slate-400
          "
          title="Send message"
        >
          <Send size={18} />
        </button>
      </div>

      <p
        className="
          mx-auto mt-1
          hidden max-w-4xl
          text-[11px]
          text-slate-400
          sm:block
        "
      >
        Enter to send · Shift + Enter for new line
      </p>
    </div>
  );
}