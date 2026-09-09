"use client";

interface TypingIndicatorProps {
  name?: string;
}

export default function TypingIndicator({
  name = "Someone",
}: TypingIndicatorProps) {
  const displayName = name.trim() || "Someone";

  return (
    <div className="flex items-center gap-2 px-4 pb-2 sm:px-6">
      {/* ================= AVATAR ================= */}

      <div
        className="
          flex h-8 w-8 shrink-0
          items-center justify-center
          rounded-full
          bg-slate-200
          text-xs
          font-semibold
          text-slate-600
        "
      >
        {displayName
          .charAt(0)
          .toUpperCase()}
      </div>

      {/* ================= TYPING BUBBLE ================= */}

      <div
        className="
          flex items-center gap-1
          rounded-2xl
          rounded-bl-md
          bg-white
          px-4 py-3
          shadow-sm
          ring-1 ring-slate-100
        "
        aria-label={`${displayName} is typing`}
      >
        <span
          className="
            h-2 w-2
            animate-bounce
            rounded-full
            bg-slate-400
            [animation-delay:-0.3s]
          "
        />

        <span
          className="
            h-2 w-2
            animate-bounce
            rounded-full
            bg-slate-400
            [animation-delay:-0.15s]
          "
        />

        <span
          className="
            h-2 w-2
            animate-bounce
            rounded-full
            bg-slate-400
          "
        />
      </div>

      {/* ================= NAME ================= */}

      <span className="text-xs text-slate-400">
        {displayName} is typing...
      </span>
    </div>
  );
}