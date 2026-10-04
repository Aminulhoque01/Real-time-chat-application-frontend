"use client";

import type { Message } from "@/src/redux/features/message/message.types";

import {
  Mic,
  Paperclip,
  Send,
  Smile,
  Square,
  Trash2,
  X,
} from "lucide-react";

import EmojiPicker, {
  type EmojiClickData,
} from "emoji-picker-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

// =========================
// MESSAGE SEND PAYLOAD
// =========================

export interface MessageSendPayload {
  text?: string;
  attachments?: File[];
  replyTo?: string;
}

// =========================
// PROPS
// =========================

interface MessageComposerProps {
  onSend?: (
    payload: MessageSendPayload,
  ) => void;

  onTypingStart?: () => void;

  onTypingStop?: () => void;

  disabled?: boolean;

  isBlocked?: boolean;

  replyingTo?: Message | null;

  onCancelReply?: () => void;
}

// =========================
// COMPONENT
// =========================

export default function MessageComposer({
  onSend,
  onTypingStart,
  onTypingStop,
  disabled = false,
  isBlocked = false,
  replyingTo,
  onCancelReply,
}: MessageComposerProps) {
  // =========================
  // COMPOSER DISABLED
  // =========================

  const composerDisabled =
    disabled || isBlocked;

  // =========================
  // MESSAGE
  // =========================

  const [message, setMessage] =
    useState("");

  // =========================
  // ATTACHMENTS
  // =========================

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<File[]>([]);

  // =========================
  // VOICE RECORDING
  // =========================

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);

  const [
    recordingTime,
    setRecordingTime,
  ] = useState(0);

  const [
    audioUrl,
    setAudioUrl,
  ] = useState<string | null>(
    null,
  );

  const [
    audioBlob,
    setAudioBlob,
  ] = useState<Blob | null>(
    null,
  );

  // =========================
  // EMOJI PICKER
  // =========================

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  // =========================
  // REFS
  // =========================

  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const textareaRef =
    useRef<HTMLTextAreaElement>(null);

  const emojiPickerRef =
    useRef<HTMLDivElement>(null);

  const mediaRecorderRef =
    useRef<MediaRecorder | null>(
      null,
    );

  const mediaStreamRef =
    useRef<MediaStream | null>(
      null,
    );

  const audioChunksRef =
    useRef<Blob[]>([]);

  const recordingTimerRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  const typingTimeoutRef =
    useRef<ReturnType<
      typeof setTimeout
    > | null>(null);

  // =========================
  // REPLY PREVIEW
  // =========================

  const replySenderName =
    replyingTo &&
    typeof replyingTo.senderId !==
      "string"
      ? replyingTo.senderId.name
      : "User";

  const replyPreviewText =
    replyingTo?.isDeleted
      ? "This message was deleted"
      : replyingTo?.text?.trim()
        ? replyingTo.text
        : replyingTo?.attachments
              ?.length
          ? "Attachment"
          : replyingTo
            ? "Message"
            : "";

  // =========================
  // CLEAR TYPING TIMER
  // =========================

  const clearTypingTimer =
    () => {
      if (
        typingTimeoutRef.current
      ) {
        clearTimeout(
          typingTimeoutRef.current,
        );

        typingTimeoutRef.current =
          null;
      }
    };

  // =========================
  // CLEAR RECORDING TIMER
  // =========================

  const clearRecordingTimer =
    () => {
      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current,
        );

        recordingTimerRef.current =
          null;
      }
    };

  // =========================
  // STOP MEDIA STREAM
  // =========================

  const stopMediaStream =
    () => {
      if (
        mediaStreamRef.current
      ) {
        mediaStreamRef.current
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            },
          );

        mediaStreamRef.current =
          null;
      }
    };

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {
    return () => {
      clearTypingTimer();

      clearRecordingTimer();

      stopMediaStream();

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl,
        );
      }
    };
  }, [audioUrl]);

  // =========================
  // OUTSIDE CLICK
  // EMOJI PICKER CLOSE
  // =========================

  useEffect(() => {
    if (!showEmojiPicker) {
      return;
    }

    const handleOutsideClick = (
      event: MouseEvent | TouchEvent,
    ) => {
      const target =
        event.target as Node;

      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(
          target,
        )
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "touchstart",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "touchstart",
        handleOutsideClick,
      );
    };
  }, [showEmojiPicker]);

  // =========================
  // BLOCKED USER CLEANUP
  // =========================

  useEffect(() => {
    if (!isBlocked) {
      return;
    }

    onTypingStop?.();

    clearTypingTimer();

    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      recorder.stop();
    }

    clearRecordingTimer();

    stopMediaStream();

    mediaRecorderRef.current =
      null;

    audioChunksRef.current =
      [];

    setMessage("");

    setSelectedFiles([]);

    setIsRecording(false);

    setRecordingTime(0);

    setAudioBlob(null);

    setShowEmojiPicker(false);

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl,
      );

      setAudioUrl(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }

    onCancelReply?.();
  }, [
    isBlocked,
    onTypingStop,
    onCancelReply,
  ]);

  // =========================
  // EMOJI CLICK
  // =========================

  const handleEmojiClick = (
    emojiData: EmojiClickData,
  ) => {
    if (composerDisabled) {
      return;
    }

    const emoji =
      emojiData.emoji;

    setMessage(
      (previousMessage) =>
        `${previousMessage}${emoji}`,
    );

    // Keep textarea focused
    requestAnimationFrame(() => {
      const textarea =
        textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();

      const length =
        textarea.value.length;

      textarea.setSelectionRange(
        length,
        length,
      );
    });
  };

  // =========================
  // TOGGLE EMOJI PICKER
  // =========================

  const handleEmojiToggle =
    () => {
      if (composerDisabled) {
        return;
      }

      setShowEmojiPicker(
        (previous) => !previous,
      );
    };

  // =========================
  // SEND MESSAGE
  // =========================

  const handleSend = () => {
    if (composerDisabled) {
      return;
    }

    const trimmedMessage =
      message.trim();

    if (
      !trimmedMessage &&
      selectedFiles.length === 0
    ) {
      return;
    }

    onTypingStop?.();

    clearTypingTimer();

    onSend?.({
      text:
        trimmedMessage ||
        undefined,

      attachments:
        selectedFiles.length > 0
          ? selectedFiles
          : undefined,

      replyTo:
        replyingTo?._id,
    });

    setMessage("");

    setSelectedFiles([]);

    setShowEmojiPicker(false);

    if (fileInputRef.current) {
      fileInputRef.current.value =
        "";
    }

    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  // =========================
  // HANDLE MESSAGE CHANGE
  // =========================

  const handleMessageChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    if (composerDisabled) {
      return;
    }

    const value =
      event.target.value;

    setMessage(value);

    if (!value.trim()) {
      onTypingStop?.();

      clearTypingTimer();

      return;
    }

    onTypingStart?.();

    clearTypingTimer();

    typingTimeoutRef.current =
      setTimeout(() => {
        onTypingStop?.();

        typingTimeoutRef.current =
          null;
      }, 1000);
  };

  // =========================
  // KEYBOARD
  // =========================

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (composerDisabled) {
      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSend();
    }
  };

  // =========================
  // ATTACHMENT CLICK
  // =========================

  const handleAttachmentClick =
    () => {
      if (composerDisabled) {
        return;
      }

      fileInputRef.current?.click();
    };

  // =========================
  // FILE CHANGE
  // =========================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (composerDisabled) {
      event.target.value = "";

      return;
    }

    const files =
      event.target.files;

    if (
      !files ||
      files.length === 0
    ) {
      return;
    }

    const newFiles =
      Array.from(files);

    setSelectedFiles(
      (previous) => [
        ...previous,
        ...newFiles,
      ],
    );

    event.target.value = "";
  };

  // =========================
  // REMOVE FILE
  // =========================

  const handleRemoveFile = (
    index: number,
  ) => {
    if (composerDisabled) {
      return;
    }

    setSelectedFiles(
      (previous) =>
        previous.filter(
          (_, fileIndex) =>
            fileIndex !== index,
        ),
    );
  };

  // =========================
  // FORMAT FILE SIZE
  // =========================

  const formatFileSize = (
    bytes: number,
  ) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (
      bytes <
      1024 * 1024
    ) {
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

  // =========================
  // FILE ICON
  // =========================

  const getFileIcon = (
    file: File,
  ) => {
    if (
      file.type.startsWith(
        "image/",
      )
    ) {
      return "🖼️";
    }

    if (
      file.type.startsWith(
        "video/",
      )
    ) {
      return "🎥";
    }

    if (
      file.type.startsWith(
        "audio/",
      )
    ) {
      return "🎵";
    }

    if (
      file.type ===
      "application/pdf"
    ) {
      return "📕";
    }

    return "📄";
  };

  // =========================
  // FORMAT TIME
  // =========================

  const formatTime = (
    seconds: number,
  ) => {
    const minutes =
      Math.floor(
        seconds / 60,
      );

    const remainingSeconds =
      seconds % 60;

    return `${minutes
      .toString()
      .padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  // =========================
  // START RECORDING
  // =========================

  const handleStartRecording =
    async () => {
      if (
        composerDisabled ||
        isRecording ||
        selectedFiles.length > 0
      ) {
        return;
      }

      // Close emoji picker
      setShowEmojiPicker(false);

      try {
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              audio: true,
            },
          );

        if (isBlocked) {
          stream
            .getTracks()
            .forEach(
              (track) => {
                track.stop();
              },
            );

          return;
        }

        mediaStreamRef.current =
          stream;

        audioChunksRef.current =
          [];

        const mediaRecorder =
          new MediaRecorder(
            stream,
          );

        mediaRecorderRef.current =
          mediaRecorder;

        mediaRecorder.ondataavailable =
          (event) => {
            if (
              event.data.size > 0
            ) {
              audioChunksRef.current.push(
                event.data,
              );
            }
          };

        mediaRecorder.onstop =
          () => {
            const blob =
              new Blob(
                audioChunksRef.current,
                {
                  type:
                    mediaRecorder.mimeType ||
                    "audio/webm",
                },
              );

            if (isBlocked) {
              stream
                .getTracks()
                .forEach(
                  (track) => {
                    track.stop();
                  },
                );

              return;
            }

            const url =
              URL.createObjectURL(
                blob,
              );

            setAudioBlob(blob);

            setAudioUrl(url);

            stream
              .getTracks()
              .forEach(
                (track) => {
                  track.stop();
                },
              );

            mediaStreamRef.current =
              null;
          };

        mediaRecorder.start();

        setIsRecording(true);

        setRecordingTime(0);

        recordingTimerRef.current =
          setInterval(() => {
            setRecordingTime(
              (previous) =>
                previous + 1,
            );
          }, 1000);
      } catch (error) {
        console.error(
          "Microphone access error:",
          error,
        );

        alert(
          "Microphone permission is required to record voice.",
        );
      }
    };

  // =========================
  // STOP RECORDING
  // =========================

  const handleStopRecording =
    () => {
      if (composerDisabled) {
        return;
      }

      const recorder =
        mediaRecorderRef.current;

      if (
        !recorder ||
        recorder.state ===
          "inactive"
      ) {
        return;
      }

      recorder.stop();

      setIsRecording(false);

      clearRecordingTimer();
    };

  // =========================
  // CANCEL RECORDING
  // =========================

  const handleCancelRecording =
    () => {
      const recorder =
        mediaRecorderRef.current;

      if (
        recorder &&
        recorder.state !==
          "inactive"
      ) {
        recorder.stop();
      }

      clearRecordingTimer();

      stopMediaStream();

      setIsRecording(false);

      setRecordingTime(0);

      audioChunksRef.current =
        [];

      mediaRecorderRef.current =
        null;

      if (audioUrl) {
        URL.revokeObjectURL(
          audioUrl,
        );
      }

      setAudioUrl(null);

      setAudioBlob(null);
    };

  // =========================
  // SEND VOICE
  // =========================

  const handleSendVoice = () => {
    if (
      !audioBlob ||
      composerDisabled
    ) {
      return;
    }

    const voiceFile =
      new File(
        [audioBlob],
        `voice-${Date.now()}.webm`,
        {
          type:
            audioBlob.type ||
            "audio/webm",
        },
      );

    onSend?.({
      attachments: [
        voiceFile,
      ],

      replyTo:
        replyingTo?._id,
    });

    if (audioUrl) {
      URL.revokeObjectURL(
        audioUrl,
      );
    }

    setAudioUrl(null);

    setAudioBlob(null);

    setRecordingTime(0);

    audioChunksRef.current =
      [];

    mediaRecorderRef.current =
      null;
  };

  // ============================================================
  // SHARED OUTER STYLES
  // ============================================================

  const composerOuterClass = `
    relative
    w-full
    shrink-0
    overflow-visible
    border-t
    border-slate-200
    bg-white
    px-2
    pt-2
    pb-[calc(0.5rem+env(safe-area-inset-bottom))]
    sm:px-5
    sm:py-3
  `;

  // =========================
  // BLOCKED UI
  // =========================

  if (isBlocked) {
    return (
      <div
        className={
          composerOuterClass
        }
      >
        <div className="mx-auto w-full max-w-4xl">
          <div
            className="
              flex
              min-h-10
              items-center
              justify-center
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-3
              py-2
            "
          >
            <p className="text-center text-xs text-slate-500 sm:text-sm">
              You can't send
              messages because
              this user is
              blocked.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================
  // RECORDING UI
  // =========================

  if (isRecording) {
    return (
      <div
        className={
          composerOuterClass
        }
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-4xl
            items-center
            gap-1.5
            sm:gap-3
          "
        >
          <div
            className="
              flex
              min-w-0
              flex-1
              items-center
              gap-2
              overflow-hidden
              rounded-2xl
              border
              border-red-200
              bg-red-50
              px-3
              py-2
              sm:gap-3
              sm:px-4
            "
          >
            <span
              className="
                h-2.5
                w-2.5
                shrink-0
                animate-pulse
                rounded-full
                bg-red-500
                sm:h-3
                sm:w-3
              "
            />

            <span className="truncate text-xs font-medium text-red-600 sm:text-sm">
              Recording...
            </span>

            <span className="shrink-0 font-mono text-xs text-slate-600 sm:text-sm">
              {formatTime(
                recordingTime,
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={
              handleCancelRecording
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-red-500
            "
            title="Cancel recording"
          >
            <Trash2 size={18} />
          </button>

          <button
            type="button"
            onClick={
              handleStopRecording
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-red-500
              text-white
              transition
              hover:bg-red-600
            "
            title="Stop recording"
          >
            <Square
              size={17}
              fill="currentColor"
            />
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // VOICE PREVIEW UI
  // =========================

  if (
    audioUrl &&
    audioBlob
  ) {
    return (
      <div
        className={
          composerOuterClass
        }
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-4xl
            items-center
            gap-1.5
            sm:gap-2
          "
        >
          <button
            type="button"
            onClick={
              handleCancelRecording
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-red-500
            "
            title="Delete recording"
          >
            <Trash2 size={18} />
          </button>

          <div
            className="
              flex
              min-w-0
              flex-1
              items-center
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-2
              py-1.5
              sm:px-3
              sm:py-2
            "
          >
            <audio
              src={audioUrl}
              controls
              className="h-9 w-full min-w-0"
            />
          </div>

          <button
            type="button"
            onClick={
              handleSendVoice
            }
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-slate-900
              text-white
              transition
              hover:bg-slate-800
            "
            title="Send voice message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    );
  }

  // =========================
  // NORMAL COMPOSER
  // =========================

  return (
    <div
      className={
        composerOuterClass
      }
    >
      <div className="mx-auto w-full max-w-4xl min-w-0">
        {/* =========================
            REPLY PREVIEW
        ========================= */}

        {replyingTo && (
          <div
            className="
              mb-2
              flex
              min-w-0
              items-start
              gap-2
              overflow-hidden
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-2.5
              py-2
              sm:mb-3
              sm:gap-3
              sm:px-3
            "
          >
            <div
              className="
                mt-0.5
                h-8
                w-1
                shrink-0
                rounded-full
                bg-slate-900
                sm:h-9
              "
            />

            <div className="min-w-0 flex-1 overflow-hidden">
              <p
                className="
                  truncate
                  text-[11px]
                  font-semibold
                  text-slate-700
                  sm:text-xs
                "
              >
                Replying to{" "}
                {replySenderName}
              </p>

              <p
                className="
                  mt-0.5
                  truncate
                  text-[11px]
                  text-slate-500
                  sm:text-xs
                "
                title={
                  replyPreviewText
                }
              >
                {replyPreviewText}
              </p>
            </div>

            <button
              type="button"
              onClick={
                onCancelReply
              }
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                text-slate-400
                transition
                hover:bg-slate-200
                hover:text-slate-700
              "
              title="Cancel reply"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* =========================
            ATTACHMENT PREVIEW
        ========================= */}

        {selectedFiles.length >
          0 && (
          <div
            className="
              mb-2
              flex
              max-h-24
              min-w-0
              flex-wrap
              gap-1.5
              overflow-x-hidden
              overflow-y-auto
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              p-1.5
              sm:mb-3
              sm:max-h-32
              sm:gap-2
              sm:rounded-2xl
              sm:p-2
            "
          >
            {selectedFiles.map(
              (
                file,
                index,
              ) => (
                <div
                  key={`${file.name}-${file.lastModified}-${index}`}
                  className="
                    flex
                    min-w-0
                    max-w-[calc(100%-4px)]
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-slate-200
                    bg-white
                    px-1.5
                    py-1.5
                    sm:max-w-[240px]
                    sm:gap-2
                    sm:rounded-xl
                    sm:px-2
                    sm:py-2
                  "
                >
                  <span className="shrink-0 text-base sm:text-lg">
                    {getFileIcon(
                      file,
                    )}
                  </span>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p
                      className="
                        truncate
                        text-[11px]
                        font-medium
                        text-slate-700
                        sm:text-xs
                      "
                      title={
                        file.name
                      }
                    >
                      {file.name}
                    </p>

                    <p className="text-[9px] text-slate-400 sm:text-[10px]">
                      {formatFileSize(
                        file.size,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleRemoveFile(
                        index,
                      )
                    }
                    className="
                      flex
                      h-6
                      w-6
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      text-slate-400
                      transition
                      hover:bg-slate-100
                      hover:text-red-500
                    "
                    title="Remove file"
                  >
                    <X size={13} />
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        {/* =========================
            COMPOSER ROW
        ========================= */}

        <div
          className="
            flex
            min-w-0
            items-end
            gap-1
            sm:gap-2
          "
        >
          {/* ATTACHMENT */}

          <button
            type="button"
            onClick={
              handleAttachmentClick
            }
            disabled={
              composerDisabled
            }
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-700
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:h-10
              sm:w-10
            "
            title="Attach file"
          >
            <Paperclip
              size={19}
            />
          </button>

          <input
            ref={
              fileInputRef
            }
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime,audio/mpeg,audio/wav,audio/webm,audio/ogg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
            className="hidden"
            onChange={
              handleFileChange
            }
          />

          {/* =========================
              MESSAGE INPUT
          ========================= */}

          <div
            className="
              relative
              flex
              min-h-9
              min-w-0
              flex-1
              items-end
              overflow:visible
              rounded-2xl
              border
              border-slate-200
              bg-slate-50
              px-2
              py-1.5
              transition
              focus-within:border-slate-300
              focus-within:bg-white
              sm:min-h-10
              sm:px-3
              sm:py-2
            "
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={
                handleMessageChange
              }
              onKeyDown={
                handleKeyDown
              }
              disabled={
                composerDisabled
              }
              rows={1}
              placeholder="Type a message..."
              className="
                min-h-5
                min-w-0
                max-h-24
                flex-1
                resize-none
                overflow-y-auto
                bg-transparent
                px-1
                text-[13px]
                leading-5
                text-slate-800
                outline-none
                placeholder:text-slate-400
                disabled:cursor-not-allowed
                sm:max-h-32
                sm:text-sm
              "
            />

            {/* =========================
                EMOJI BUTTON
            ========================= */}

            <button
              type="button"
              disabled={
                composerDisabled
              }
              onClick={
                handleEmojiToggle
              }
              className={`
                ml-0.5
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                transition
                disabled:opacity-50
                sm:ml-1
                ${
                  showEmojiPicker
                    ? "bg-slate-200 text-slate-700"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }
              `}
              title="Emoji"
              aria-label="Open emoji picker"
              aria-expanded={
                showEmojiPicker
              }
            >
              <Smile
                size={18}
              />
            </button>

            {/* =========================
                EMOJI PICKER
            ========================= */}

            {showEmojiPicker && (
              <div
                ref={
                  emojiPickerRef
                }
                className="
                  absolute
                  bottom-full
                  right-0
                  z-[100]
                  mb-2
                  w-[min(320px,calc(100vw-16px))]
                  max-w-[calc(100vw-16px)]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  shadow-2xl
                "
              >
                <EmojiPicker
                  onEmojiClick={
                    handleEmojiClick
                  }
                  width="100%"
                  height={350}
                  previewConfig={{
                    showPreview: false,
                  }}
                  searchDisabled={
                    false
                  }
                  skinTonesDisabled={
                    false
                  }
                />
              </div>
            )}
          </div>

          {/* =========================
              VOICE
          ========================= */}

          <button
            type="button"
            onClick={
              handleStartRecording
            }
            disabled={
              composerDisabled ||
              selectedFiles.length >
                0
            }
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              text-slate-500
              transition
              hover:bg-slate-100
              hover:text-slate-700
              active:scale-95
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:h-10
              sm:w-10
            "
            title="Record voice"
          >
            <Mic size={19} />
          </button>

          {/* =========================
              SEND
          ========================= */}

          <button
            type="button"
            onClick={
              handleSend
            }
            disabled={
              composerDisabled ||
              (
                !message.trim() &&
                selectedFiles.length ===
                  0
              )
            }
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-slate-900
              text-white
              transition
              hover:bg-slate-800
              active:scale-95
              disabled:cursor-not-allowed
              disabled:bg-slate-200
              disabled:text-slate-400
              sm:h-10
              sm:w-10
            "
            title="Send message"
          >
            <Send size={17} />
          </button>
        </div>

        {/* =========================
            HELP TEXT
        ========================= */}

        <p
          className="
            mx-auto
            mt-1
            hidden
            text-center
            text-[11px]
            text-slate-400
            sm:block
          "
        >
          Enter to send · Shift +
          Enter for new line
        </p>
      </div>
    </div>
  );
}