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

// Blocked user
isBlocked?: boolean;

// Reply
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
// REFS
// =========================

const fileInputRef =
useRef<HTMLInputElement>(null);

const mediaRecorderRef =
useRef<MediaRecorder | null>(
null,
);

const mediaStreamRef =
useRef<MediaStream | null>(null);

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

const clearTypingTimer = () => {
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

const clearRecordingTimer = () => {
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

const stopMediaStream = () => {
if (
mediaStreamRef.current
) {
mediaStreamRef.current
.getTracks()
.forEach((track) => {
track.stop();
});


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
// BLOCKED USER CLEANUP
// =========================

useEffect(() => {
if (!isBlocked) {
return;
}


// Stop typing
onTypingStop?.();

clearTypingTimer();

// Stop recording
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

// Clear message
setMessage("");

// Clear attachments
setSelectedFiles([]);

// Clear recording
setIsRecording(false);

setRecordingTime(0);

setAudioBlob(null);

if (audioUrl) {
  URL.revokeObjectURL(
    audioUrl,
  );

  setAudioUrl(null);
}

// Clear file input
if (fileInputRef.current) {
  fileInputRef.current.value =
    "";
}

// Cancel reply
onCancelReply?.();


}, [
isBlocked,
onTypingStop,
onCancelReply,
]);

// =========================
// SEND MESSAGE
// =========================

const handleSend = () => {
if (composerDisabled) {
return;
}


const trimmedMessage =
  message.trim();

// Empty message
if (
  !trimmedMessage &&
  selectedFiles.length === 0
) {
  return;
}

// Stop typing
onTypingStop?.();

clearTypingTimer();

// Send
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

// Reset
setMessage("");

setSelectedFiles([]);

if (fileInputRef.current) {
  fileInputRef.current.value =
    "";
}


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

// Empty input
if (!value.trim()) {
  onTypingStop?.();

  clearTypingTimer();

  return;
}

// Start typing
onTypingStart?.();

// Reset timeout
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

console.log(
  "SELECTED FILES:",
  newFiles,
);

// Allow selecting same file
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
  .padStart(
    2,
    "0",
  )}:${remainingSeconds
  .toString()
  .padStart(
    2,
    "0",
  )}`;
 

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

 
  try {
    const stream =
      await navigator.mediaDevices.getUserMedia(
        {
          audio: true,
        },
      );

    // Check blocked state again
    if (isBlocked) {
      stream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

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

    mediaRecorder.onstop = () => {
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
          .forEach((track) => {
            track.stop();
          });

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
        .forEach((track) => {
          track.stop();
        });

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

console.log(
  "VOICE FILE:",
  {
    name: voiceFile.name,
    type: voiceFile.type,
    size: voiceFile.size,
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

// =========================
// BLOCKED UI
// =========================

if (isBlocked) {
return ( <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4"> <div className="mx-auto max-w-4xl"> <div className="flex min-h-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"> <p className="text-center text-sm text-slate-500">
You can't send
messages because this
user is blocked. </p> </div> </div> </div>
);
}

// =========================
// RECORDING UI
// =========================

if (isRecording) {
return ( <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4"> <div className="mx-auto flex max-w-4xl items-center gap-3"> <div
         className="
           flex h-10 flex-1
           items-center gap-3
           rounded-2xl
           border border-red-200
           bg-red-50
           px-4
         "
       > <span
           className="
             h-3 w-3
             animate-pulse
             rounded-full
             bg-red-500
           "
         />

 
        <span className="text-sm font-medium text-red-600">
          Recording...
        </span>

        <span className="font-mono text-sm text-slate-600">
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
          flex h-10 w-10
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
          flex h-10 w-10
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
return ( <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4"> <div className="mx-auto flex max-w-4xl items-center gap-2">
<button
type="button"
onClick={
handleCancelRecording
}
className="
flex h-10 w-10
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
> <Trash2 size={19} /> </button>

 
      <div
        className="
          flex min-w-0 flex-1
          items-center
          rounded-2xl
          border border-slate-200
          bg-slate-50
          px-3 py-2
        "
      >
        <audio
          src={audioUrl}
          controls
          className="h-9 w-full"
        />
      </div>

      <button
        type="button"
        onClick={
          handleSendVoice
        }
        className="
          flex h-10 w-10
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

return ( <div className="border-t border-slate-200 bg-white px-3 py-3 sm:px-5 sm:py-4"> <div className="mx-auto max-w-4xl">
 
    {/* REPLY PREVIEW */}

    {replyingTo && (
      <div
        className="
          mb-3
          flex
          items-start
          gap-3
          rounded-xl
          border
          border-slate-200
          bg-slate-50
          px-3
          py-2
        "
      >
        <div
          className="
            mt-0.5
            h-9
            w-1
            shrink-0
            rounded-full
            bg-slate-900
          "
        />

        <div className="min-w-0 flex-1">
          <p
            className="
              text-xs
              font-semibold
              text-slate-700
            "
          >
            Replying to{" "}
            {replySenderName}
          </p>

          <p
            className="
              mt-0.5
              truncate
              text-xs
              text-slate-500
            "
            title={
              replyPreviewText
            }
          >
            {
              replyPreviewText
            }
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
          <X size={16} />
        </button>
      </div>
    )}

    {/* ATTACHMENT PREVIEW */}

    {selectedFiles.length >
      0 && (
      <div
        className="
          mb-3
          flex
          max-h-32
          flex-wrap
          gap-2
          overflow-y-auto
          rounded-2xl
          border
          border-slate-200
          bg-slate-50
          p-2
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
                max-w-[240px]
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-2
                py-2
              "
            >
              <span className="shrink-0 text-lg">
                {getFileIcon(
                  file,
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className="
                    truncate
                    text-xs
                    font-medium
                    text-slate-700
                  "
                  title={
                    file.name
                  }
                >
                  {file.name}
                </p>

                <p className="text-[10px] text-slate-400">
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
                <X size={14} />
              </button>
            </div>
          ),
        )}
      </div>
    )}

    {/* COMPOSER */}

    <div className="flex items-end gap-2">

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
          flex h-10 w-10
          shrink-0
          items-center
          justify-center
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

      {/* MESSAGE INPUT */}

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

        {/* EMOJI */}

        <button
          type="button"
          disabled={
            composerDisabled
          }
          className="
            ml-1
            flex h-7 w-7
            shrink-0
            items-center
            justify-center
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

      {/* VOICE */}

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
          flex h-10 w-10
          shrink-0
          items-center
          justify-center
          rounded-full
          text-slate-500
          transition
          hover:bg-slate-100
          hover:text-slate-700
          disabled:cursor-not-allowed
          disabled:opacity-50
        "
        title="Record voice"
      >
        <Mic size={20} />
      </button>

      {/* SEND */}

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
          flex h-10 w-10
          shrink-0
          items-center
          justify-center
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

    {/* HELP TEXT */}

    <p
      className="
        mx-auto mt-1
        hidden
        text-[11px]
        text-slate-400
        sm:block
      "
    >
      Enter to send · Shift + Enter
      for new line
    </p>
  </div>
</div>
 

);
}
