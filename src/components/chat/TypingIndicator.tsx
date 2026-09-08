"use client";

interface TypingIndicatorProps {
  name?: string;
}

export default function TypingIndicator({
  name = "Someone",
}: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 pb-2 sm:px-6">
      {/* Avatar */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
        {name.charAt(0).toUpperCase()}
      </div>

      {/* Typing bubble */}
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
      </div>

      <span className="text-xs text-slate-400">
        {name} is typing...
      </span>
    </div>
  );
}