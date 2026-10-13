
"use client";

import { useEffect, useRef, useState } from "react";

import {
  Check,
  Loader2,
  Menu,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  X,
  Clock,
} from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageComposer, {
  type MessageSendPayload,
} from "./MessageComposer";
import MessageList from "./MessageList";
import TypingIndicator from "./TypingIndicator";
import EmptyChat from "./EmptyChat";
import GroupModal from "./GroupModal";

import type {
  Conversation,
  ConversationUser,
} from "@/src/redux/features/conversation/conversation.types";

import type { Message } from "@/src/redux/features/message/message.types";

// ==================================================
// WEBRTC TYPES
// ==================================================

type CallType = "audio" | "video";

type CallStatus =
  | "idle"
  | "ringing"
  | "calling"
  | "connecting"
  | "connected"
  | "ended";

interface IncomingCall {
  callId: string;
  callerId: string;
  receiverId: string;
  type: CallType;
  status: "ringing";
  callerName?: string;
  callerAvatar?: string | null;
  caller?: {
    _id?: string;
    name?: string;
    avatar?: string | null;
    avatarUrl?: string | null;
  };
}

// ==================================================
// PROPS
// ==================================================

interface ChatUIProps {
  conversation: Conversation | null;
  currentUserId?: string;
  isCallDisabled: boolean;
  onOpenSidebar: () => void;
  onOpenProfile: () => void;

  isBlocked?: boolean;

  onSendMessage?: (payload: MessageSendPayload) => void;

  replyingTo?: Message | null;
  onReplyMessage?: (message: Message) => void;
  onCancelReply?: () => void;

  onTypingStart?: () => void;
  onTypingStop?: () => void;

  markMessageAsRead?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => boolean;
  onEditMessage?: (messageId: string, text: string) => boolean;
  onReactionMessage?: (messageId: string, emoji: string) => boolean;

  isTyping?: boolean;
  typingUserName?: string;
  isSending?: boolean;

  onGroupUpdated?: (conversation: Conversation) => void;
  onGroupDeleted?: (conversationId: string) => void;
  onGroupLeft?: () => void;

  // WebRTC state
  callStatus: CallStatus;
  incomingCall: IncomingCall | null;
  activeCallId: string | null;
  callType: CallType | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callError: string | null;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;

  // WebRTC actions
  onStartCall: (
    receiverId: string,
    type: CallType,
  ) => Promise<boolean>;

  onAcceptCall: () => Promise<boolean>;
  onRejectCall: () => boolean;
  onCancelCall: () => boolean;
  onEndCall: () => void;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
}

// ==================================================
// HELPERS
// ==================================================

const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
): ConversationUser | null => {
  if (conversation.type === "group") return null;

  return (
    conversation.participants.find(
      (participant) =>
        String(participant._id) !== String(currentUserId),
    ) ?? null
  );
};

const getConversationName = (
  conversation: Conversation,
  currentUserId?: string,
): string => {
  if (conversation.type === "group") {
    return conversation.name?.trim() || "Group";
  }

  const user = getOtherParticipant(conversation, currentUserId);

  return user?.name?.trim() || user?.phone || "Unknown";
};

const getConversationAvatar = (
  conversation: Conversation,
  currentUserId?: string,
): string | null => {
  if (conversation.type === "group") return null;

  return getOtherParticipant(conversation, currentUserId)?.avatar ?? null;
};

const getCallStatusLabel = (status: CallStatus): string => {
  switch (status) {
    case "ringing":
      return "Incoming call";
    case "calling":
      return "Calling...";
    case "connecting":
      return "Connecting...";
    case "connected":
      return "Connected";
    case "ended":
      return "Call ended";
    default:
      return "";
  }
};

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) return "?";

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

export const formatCallDuration = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (value: number) => String(value).padStart(2, "0");

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(minutes)}:${pad(seconds)}`;
};

// ==================================================
// CHAT UI
// ==================================================

export default function ChatUI({
  conversation,
  currentUserId,
  onOpenSidebar,
  onOpenProfile,
  isBlocked = false,
  onSendMessage,
  replyingTo,
  onReplyMessage,
  onCancelReply,
  onTypingStart,
  onTypingStop,
  markMessageAsRead,
  onDeleteMessage,
  onEditMessage,
  onReactionMessage,
  isTyping = false,
  typingUserName,
  isSending = false,
  onGroupUpdated,
  onGroupDeleted,
  onGroupLeft,
  callStatus,
  incomingCall,
  activeCallId,
  callType,
  localStream,
  remoteStream,
  callError,
  isMicrophoneEnabled,
  isCameraEnabled,
  onStartCall,
  onAcceptCall,
  onRejectCall,
  onCancelCall,
  onEndCall,
  onToggleMicrophone,
  onToggleCamera,
}: ChatUIProps) {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const [isMediaPermissionModalOpen, setIsMediaPermissionModalOpen] =
    useState(false);

  const [mediaPermissionError, setMediaPermissionError] =
    useState<string | null>(null);

  const [isStartingVideoCall, setIsStartingVideoCall] = useState(false);

  // ==================================================
  // CALL TIMER
  // ==================================================

  const [callDuration, setCallDuration] = useState(0);
  const callStartedAtRef = useRef<number | null>(null);
  const timerCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (callStatus !== "connected" || !activeCallId) {
      return;
    }

    if (timerCallIdRef.current !== activeCallId) {
      timerCallIdRef.current = activeCallId;
      callStartedAtRef.current = Date.now();
      setCallDuration(0);
    }

    const updateTimer = () => {
      const startedAt = callStartedAtRef.current;

      if (startedAt === null) return;

      setCallDuration(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    };

    updateTimer();

    const intervalId = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(intervalId);
  }, [callStatus, activeCallId]);

  useEffect(() => {
    if (callStatus === "idle" || !activeCallId) {
      callStartedAtRef.current = null;
      timerCallIdRef.current = null;
      setCallDuration(0);
    }
  }, [callStatus, activeCallId]);

  // ==================================================
  // PARTICIPANT INFORMATION
  // ==================================================

  const otherUser = conversation
    ? getOtherParticipant(conversation, currentUserId)
    : null;

  const otherUserId = otherUser?._id
    ? String(otherUser._id)
    : null;

  const conversationName = conversation
    ? getConversationName(conversation, currentUserId)
    : "";

  const conversationAvatar = conversation
    ? getConversationAvatar(conversation, currentUserId)
    : null;

  const incomingCallerName =
    incomingCall?.callerName?.trim() ||
    incomingCall?.caller?.name?.trim() ||
    (incomingCall &&
    otherUser &&
    String(otherUser._id) === String(incomingCall.callerId)
      ? otherUser.name?.trim() || otherUser.phone
      : null) ||
    "Unknown caller";

  const incomingCallerAvatar =
    incomingCall?.callerAvatar ||
    incomingCall?.caller?.avatar ||
    incomingCall?.caller?.avatarUrl ||
    (incomingCall &&
    otherUser &&
    String(otherUser._id) === String(incomingCall.callerId)
      ? otherUser.avatar
      : null) ||
    null;

  // ==================================================
  // CALL ACTIONS
  // ==================================================

  const handleStartAudioCall = () => {
    if (
      !conversation ||
      conversation.type === "group" ||
      !otherUserId ||
      callStatus !== "idle"
    ) {
      return;
    }

    void onStartCall(otherUserId, "audio");
  };

  const handleStartVideoCall = async () => {
    if (
      !conversation ||
      conversation.type === "group" ||
      !otherUserId ||
      callStatus !== "idle" ||
      isStartingVideoCall
    ) {
      return;
    }

    setMediaPermissionError(null);
    setIsStartingVideoCall(true);

    try {
      const started = await onStartCall(otherUserId, "video");

      if (!started) {
        setMediaPermissionError(
          callError ||
            "Camera or microphone could not be accessed. Check your device and browser permissions.",
        );
        setIsMediaPermissionModalOpen(true);
      } else {
        setIsMediaPermissionModalOpen(false);
        setMediaPermissionError(null);
      }
    } catch (error) {
      setMediaPermissionError(
        error instanceof Error
          ? error.message
          : "Unable to access your camera or microphone.",
      );

      setIsMediaPermissionModalOpen(true);
    } finally {
      setIsStartingVideoCall(false);
    }
  };

  const closeMediaPermissionModal = () => {
    setIsMediaPermissionModalOpen(false);
    setMediaPermissionError(null);
  };

  const handleRetryVideoCall = () => {
    closeMediaPermissionModal();
    window.setTimeout(() => {
      void handleStartVideoCall();
    }, 150);
  };

  // If the hook reports a media error asynchronously, show the modal too.
  useEffect(() => {
    if (!callError) return;

    const normalized = callError.toLowerCase();

    const looksLikeMediaError =
      normalized.includes("camera") ||
      normalized.includes("microphone") ||
      normalized.includes("notfounderror") ||
      normalized.includes("devicesnotfounderror") ||
      normalized.includes("notallowederror") ||
      normalized.includes("permission") ||
      normalized.includes("getusermedia") ||
      normalized.includes("device not found");

    if (looksLikeMediaError && callStatus === "idle") {
      setMediaPermissionError(callError);
      setIsMediaPermissionModalOpen(true);
    }
  }, [callError, callStatus]);

  // ==================================================
  // GROUP ACTIONS
  // ==================================================

  const handleGroupUpdated = (updated: Conversation) => {
    onGroupUpdated?.(updated);
  };

  const handleGroupDeleted = (id: string) => {
    setIsGroupModalOpen(false);
    onGroupDeleted?.(id);
  };

  const handleGroupLeft = () => {
    setIsGroupModalOpen(false);
    onGroupLeft?.();
  };

  // ==================================================
  // CALL OVERLAYS
  // ==================================================

  const callOverlay =
    activeCallId && callStatus !== "idle" ? (
      <ActiveCallOverlay
        callStatus={callStatus}
        callType={callType}
        localStream={localStream}
        remoteStream={remoteStream}
        callError={callError}
        isMicrophoneEnabled={isMicrophoneEnabled}
        isCameraEnabled={isCameraEnabled}
        callDuration={callDuration}
        onToggleMicrophone={onToggleMicrophone}
        onToggleCamera={onToggleCamera}
        onCancelCall={onCancelCall}
        onEndCall={onEndCall}
      />
    ) : null;

  const incomingCallModal =
    incomingCall && callStatus === "ringing" ? (
      <IncomingCallModal
        incomingCall={incomingCall}
        callerName={incomingCallerName}
        callerAvatar={incomingCallerAvatar}
        onAccept={onAcceptCall}
        onReject={onRejectCall}
      />
    ) : null;

  // ==================================================
  // SHARED MODALS
  // Render these for both selected and unselected conversations.
  // ==================================================

  const mediaPermissionModal = isMediaPermissionModalOpen ? (
    <MediaPermissionModal
      error={mediaPermissionError || callError}
      isLoading={isStartingVideoCall}
      onRetry={handleRetryVideoCall}
      onClose={closeMediaPermissionModal}
    />
  ) : null;

  // ==================================================
  // NO CONVERSATION
  // ==================================================

  if (!conversation) {
    return (
      <main className="relative flex min-h-0 flex-1 flex-col bg-white">
        <div className="flex h-[68px] shrink-0 items-center border-b border-slate-100 bg-white px-3 lg:hidden">
          <button
            type="button"
            onClick={onOpenSidebar}
            aria-label="Open conversations"
            title="Open conversations"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          >
            <Menu size={20} />
          </button>

          <span className="ml-3 text-sm font-semibold text-slate-700">
            Messages
          </span>
        </div>

        <div className="min-h-0 flex-1">
          <EmptyChat />
        </div>

        {mediaPermissionModal}
        {incomingCallModal}
        {callOverlay}
      </main>
    );
  }

  const displayTypingName = typingUserName?.trim() || "Someone";

  return (
    <main className="relative flex min-h-0 flex-1 flex-col bg-white">
      <ChatHeader
        conversation={conversation}
        name={conversationName}
        avatar={conversationAvatar}
        otherUser={otherUser}
        onOpenSidebar={onOpenSidebar}
        onOpenProfile={onOpenProfile}
        onOpenGroupDetails={() => {
          if (conversation.type === "group") {
            setIsGroupModalOpen(true);
          }
        }}
        onStartAudioCall={handleStartAudioCall}
        onStartVideoCall={handleStartVideoCall}
        isCallDisabled={
          callStatus !== "idle" ||
          !otherUserId ||
          isStartingVideoCall
        }
      />

      <div className="min-h-0 flex-1 overflow-hidden">
        <MessageList
          conversationId={conversation._id}
          currentUserId={currentUserId}
          markMessageAsRead={markMessageAsRead}
          onReply={onReplyMessage}
          onDelete={onDeleteMessage}
          onEdit={onEditMessage}
          onReaction={onReactionMessage}
        />
      </div>

      <div
        className={`min-h-[32px] shrink-0 transition-all duration-200 ${
          isTyping ? "opacity-100" : "opacity-0"
        }`}
      >
        {isTyping && <TypingIndicator name={displayTypingName} />}
      </div>

      <MessageComposer
        onSend={onSendMessage}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
        isBlocked={isBlocked}
        replyingTo={replyingTo}
        onCancelReply={onCancelReply}
        disabled={isSending}
      />

      {conversation.type === "group" && (
        <GroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
          currentUserId={currentUserId}
          existingConversation={conversation}
          onUpdated={handleGroupUpdated}
          onLeft={handleGroupLeft}
          onDeleted={handleGroupDeleted}
        />
      )}

      {mediaPermissionModal}
      {incomingCallModal}
      {callOverlay}
    </main>
  );
}

// ==================================================
// INCOMING CALL MODAL
// ==================================================

interface IncomingCallModalProps {
  incomingCall: IncomingCall;
  callerName: string;
  callerAvatar: string | null;
  onAccept: () => Promise<boolean>;
  onReject: () => boolean;
}

function IncomingCallModal({
  incomingCall,
  callerName,
  callerAvatar,
  onAccept,
  onReject,
}: IncomingCallModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const handleAccept = async () => {
    if (isAccepting) return;

    setIsAccepting(true);
    setAcceptError(null);

    try {
      const accepted = await onAccept();

      if (!accepted) {
        setAcceptError(
          "Could not accept the call. Check your microphone/camera permissions and try again.",
        );
      }
    } catch {
      setAcceptError("Could not accept the call. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Incoming call"
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-white p-6 text-center shadow-2xl"
      >
        <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100">
          {callerAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={callerAvatar}
              alt={callerName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold">
              {getInitials(callerName)}
            </span>
          )}
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Incoming {incomingCall.type} call
        </p>

        <h2 className="mt-2 break-words text-2xl font-bold text-slate-900">
          {callerName}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {incomingCall.type === "video"
            ? "Incoming video call"
            : "Incoming audio call"}
        </p>

        {acceptError && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {acceptError}
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-8">
          <button
            type="button"
            onClick={onReject}
            disabled={isAccepting}
            aria-label="Reject call"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 active:scale-95 disabled:opacity-50"
          >
            <PhoneOff size={23} />
          </button>

          <button
            type="button"
            onClick={() => void handleAccept()}
            disabled={isAccepting}
            aria-label="Accept call"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition hover:bg-emerald-600 active:scale-95 disabled:cursor-wait disabled:opacity-50"
          >
            {isAccepting ? (
              <Loader2 size={23} className="animate-spin" />
            ) : (
              <Check size={25} />
            )}
          </button>
        </div>

        <p className="mt-5 text-xs text-slate-400">
          Accept to connect your call.
        </p>
      </section>
    </div>
  );
}

// ==================================================
// ACTIVE CALL OVERLAY
// ==================================================

interface ActiveCallOverlayProps {
  callStatus: CallStatus;
  callType: CallType | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callError: string | null;
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  callDuration: number;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  onCancelCall: () => boolean;
  onEndCall: () => void;
}

function ActiveCallOverlay({
  callStatus,
  callType,
  localStream,
  remoteStream,
  callError,
  isMicrophoneEnabled,
  isCameraEnabled,
  callDuration,
  onToggleMicrophone,
  onToggleCamera,
  onCancelCall,
  onEndCall,
}: ActiveCallOverlayProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const isVideoCall = callType === "video";
  const isConnected = callStatus === "connected";
  const isConnecting =
    callStatus === "calling" || callStatus === "connecting";

  const remoteHasVideo = Boolean(
    remoteStream
      ?.getVideoTracks()
      .some(
        (track) =>
          track.readyState === "live" && track.enabled,
      ),
  );

  useEffect(() => {
    const element = localVideoRef.current;
    if (!element) return;

    element.srcObject = localStream;

    if (localStream) {
      void element.play().catch((error) => {
        console.warn("Local video playback failed:", error);
      });
    }

    return () => {
      if (element.srcObject === localStream) {
        element.srcObject = null;
      }
    };
  }, [localStream, isVideoCall]);

  useEffect(() => {
    const element = remoteVideoRef.current;
    if (!element) return;

    element.srcObject = remoteStream;

    if (remoteStream) {
      void element.play().catch((error) => {
        console.warn("Remote video playback failed:", error);
      });
    }

    return () => {
      if (element.srcObject === remoteStream) {
        element.srcObject = null;
      }
    };
  }, [remoteStream, isVideoCall]);

  useEffect(() => {
    const element = remoteAudioRef.current;
    if (!element) return;

    element.srcObject = remoteStream;

    if (remoteStream) {
      void element.play().catch((error) => {
        console.warn(
          "Remote audio playback failed. Browser interaction may be required:",
          error,
        );
      });
    }

    return () => {
      if (element.srcObject === remoteStream) {
        element.srcObject = null;
      }
    };
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden bg-slate-950 text-white">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-slate-900">
        {isVideoCall && remoteHasVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-5 px-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/10">
              {isVideoCall ? (
                <Video size={42} className="text-slate-300" />
              ) : (
                <Phone size={40} className="text-slate-300" />
              )}
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-semibold">
                {isConnecting
                  ? "Connecting..."
                  : isConnected
                    ? "Call connected"
                    : getCallStatusLabel(callStatus)}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {isVideoCall
                  ? remoteStream
                    ? "Waiting for remote camera video..."
                    : "Waiting for remote video..."
                  : "Audio call"}
              </p>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-3 rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm shadow-lg backdrop-blur-md">
          <span className="inline-flex items-center gap-2">
            {isConnecting && (
              <Loader2 size={15} className="animate-spin" />
            )}

            {isConnected && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            )}

            {getCallStatusLabel(callStatus)}
          </span>

          {isConnected && (
            <span
              aria-label={`Call duration ${formatCallDuration(callDuration)}`}
              className="inline-flex min-w-[68px] items-center gap-1.5 border-l border-white/20 pl-3 font-mono font-semibold tabular-nums text-emerald-300"
            >
              <Clock size={14} />
              {formatCallDuration(callDuration)}
            </span>
          )}
        </div>

        {isVideoCall && localStream && (
          <div className="absolute bottom-5 right-4 h-32 w-24 overflow-hidden rounded-2xl border border-white/20 bg-slate-800 shadow-xl sm:bottom-6 sm:right-6 sm:h-48 sm:w-36">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />

            {!isCameraEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90">
                <VideoOff size={25} className="text-slate-300" />
              </div>
            )}

            <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[10px]">
              You
            </span>
          </div>
        )}

        <audio ref={remoteAudioRef} autoPlay />
      </div>

      {callError && (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {callError}
        </div>
      )}

      <div className="flex shrink-0 flex-col items-center gap-5 border-t border-white/10 bg-slate-950 px-4 py-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs text-slate-400">
            {isConnected
              ? "You are connected"
              : isConnecting
                ? "Please wait..."
                : "Call controls"}
          </p>

          {isConnected && (
            <p className="font-mono text-lg font-semibold tabular-nums text-white">
              {formatCallDuration(callDuration)}
            </p>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 sm:gap-6">
          <button
            type="button"
            onClick={onToggleMicrophone}
            aria-label={
              isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
            }
            title={
              isMicrophoneEnabled ? "Mute microphone" : "Unmute microphone"
            }
            className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 sm:h-14 sm:w-14 ${
              isMicrophoneEnabled
                ? "bg-white/10 hover:bg-white/20"
                : "bg-red-500 hover:bg-red-600"
            }`}
          >
            {isMicrophoneEnabled ? (
              <Mic size={21} />
            ) : (
              <MicOff size={21} />
            )}
          </button>

          {isVideoCall && (
            <button
              type="button"
              onClick={onToggleCamera}
              aria-label={
                isCameraEnabled ? "Turn camera off" : "Turn camera on"
              }
              title={
                isCameraEnabled ? "Turn camera off" : "Turn camera on"
              }
              className={`flex h-12 w-12 items-center justify-center rounded-full transition active:scale-95 sm:h-14 sm:w-14 ${
                isCameraEnabled
                  ? "bg-white/10 hover:bg-white/20"
                  : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isCameraEnabled ? (
                <Video size={21} />
              ) : (
                <VideoOff size={21} />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              if (isConnected) {
                onEndCall();
              } else {
                onCancelCall();
              }
            }}
            aria-label={isConnected ? "End call" : "Cancel call"}
            title={isConnected ? "End call" : "Cancel call"}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-lg transition hover:bg-red-600 active:scale-95 sm:h-16 sm:w-16"
          >
            {isConnected ? (
              <PhoneOff size={25} />
            ) : (
              <X size={25} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================================================
// MEDIA PERMISSION MODAL
// ==================================================

function MediaPermissionModal({
  error,
  isLoading,
  onRetry,
  onClose,
}: {
  error: string | null;
  isLoading: boolean;
  onRetry: () => void;
  onClose: () => void;
}) {
  const errorText = (error ?? "").toLowerCase();

  const isDeviceMissing =
    /notfounderror|devicesnotfounderror|device not found|no camera|no microphone|notfound/.test(
      errorText,
    );

  const isPermissionDenied =
    /notallowederror|permissiondeniederror|permission denied|not allowed|denied|permission/.test(
      errorText,
    );

  const title = isDeviceMissing
    ? "Camera or microphone not found"
    : isPermissionDenied
      ? "Camera and microphone permission needed"
      : "Unable to access camera or microphone";

  const description = isDeviceMissing
    ? "Your computer could not find the required camera or microphone. Connect a device and try again. If your computer has no camera, video calling will not work on this device."
    : isPermissionDenied
      ? "Your browser has not allowed access to your camera or microphone. Allow access in the browser's site settings, then try again."
      : "We could not start your video call. Check that your camera and microphone are connected and available, then try again.";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="media-permission-title"
        aria-describedby="media-permission-description"
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Close popup"
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
        >
          <X size={20} />
        </button>

        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            isDeviceMissing
              ? "bg-red-50 text-red-600"
              : "bg-blue-50 text-blue-600"
          }`}
        >
          {isDeviceMissing ? <VideoOff size={30} /> : <Video size={30} />}
        </div>

        <h2
          id="media-permission-title"
          className="mt-5 text-xl font-bold text-slate-900 sm:text-2xl"
        >
          {title}
        </h2>

        <p
          id="media-permission-description"
          className="mt-3 text-sm leading-6 text-slate-600"
        >
          {description}
        </p>

        {error && (
          <div
            role="status"
            className="mt-4 break-words rounded-xl bg-amber-50 px-4 py-3 text-left text-sm text-amber-800"
          >
            <span className="font-semibold">Details: </span>
            {error}
          </div>
        )}

        <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4 text-left">
          <div className="flex items-start gap-3">
            <Video
              size={20}
              className="mt-0.5 shrink-0 text-blue-600"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Camera access
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {isDeviceMissing
                  ? "Connect a webcam if your computer does not have a built-in camera."
                  : "Click the site settings icon near the browser address bar and allow camera access."}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mic
              size={20}
              className="mt-0.5 shrink-0 text-blue-600"
            />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Microphone access
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Check that a microphone is connected and allowed in your browser settings.
              </p>
            </div>
          </div>
        </div>

        {!isDeviceMissing && (
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Video size={18} />
            )}
            {isLoading ? "Checking devices..." : "Try Again"}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="mt-3 w-full rounded-xl px-5 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40"
        >
          {isDeviceMissing ? "Close" : "Cancel"}
        </button>
      </section>
    </div>
  );
}
