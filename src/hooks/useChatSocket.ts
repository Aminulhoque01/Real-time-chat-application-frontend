
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";
import { messageApi } from "@/src/redux/features/message/messageApi";
import { conversationApi } from "@/src/redux/features/conversation/conversationApi";
import type { Message } from "@/src/redux/features/message/message.types";
import { emitChatNotification } from "../lib/chat-notification";

// ======================================================
// TYPES
// ======================================================

interface ChatSocketProps {
  conversationId: string | null;
  onTypingStart?: (userId: string) => void;
  onTypingStop?: (userId: string) => void;
  onUserBlocked?: (data: { blockerId: string; blockedId: string }) => void;
  onUserUnblocked?: (data: { blockerId: string; blockedId: string }) => void;
}

interface PopulatedSender {
  _id: string | { toString(): string };
  phone?: string;
  name?: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  isOnline?: boolean;
  lastSeen?: string | Date | null;
}

interface ReactionUser {
  userId: string;
  name: string;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  users: ReactionUser[];
}

interface MessageReactionUpdate {
  eventId?: string;
  messageId: string;
  conversationId: string;
  action: "added" | "removed";
  reactorId?: string;
  targetUserId?: string;
  reactionSummary: ReactionSummary[];
}

interface UserBlockedEvent {
  blockerId: string;
  blockedId: string;
}

interface UserUnblockedEvent {
  blockerId: string;
  blockedId: string;
}

interface ConversationError {
  message?: string;
  conversationId?: string;
  [key: string]: unknown;
}

interface ConversationReadUpdate {
  conversationId: string;
  userId: string;
  messageIds: string[];
}

// ======================================================
// WEBRTC TYPES
// ======================================================

export type CallType = "audio" | "video";

export type CallStatus =
  | "idle"
  | "ringing"
  | "calling"
  | "connecting"
  | "connected"
  | "ended";

export interface IncomingCall {
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

interface CallParticipantPayload {
  callId: string;
  callerId: string;
  receiverId: string;
  endedBy?: string;
  duration?: number;
}

interface CallOfferPayload {
  callId: string;
  callerId?: string;
  receiverId?: string;
  offer: RTCSessionDescriptionInit;
}

interface CallAnswerPayload {
  callId: string;
  callerId?: string;
  receiverId?: string;
  answer: RTCSessionDescriptionInit;
}

interface CallIcePayload {
  callId: string;
  senderId?: string;
  candidate: RTCIceCandidateInit;
}

interface CallErrorPayload {
  message?: string;
  callId?: string;
}

// ======================================================
// HELPERS
// ======================================================

const normalizeId = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: unknown })._id;

    if (id !== null && id !== undefined && id !== "") {
      return String(id);
    }
  }

  return String(value);
};

const getPopulatedSender = (message: Message): PopulatedSender | null => {
  if (!message.senderId || typeof message.senderId !== "object") {
    return null;
  }

  return message.senderId as unknown as PopulatedSender;
};

const getNotificationBody = (message: Message): string => {
  if (message.text?.trim()) return message.text.trim();

  if (message.attachments?.length) {
    switch (message.attachments[0].type) {
      case "image":
        return "📷 Photo";
      case "video":
        return "🎥 Video";
      case "audio":
        return "🎤 Voice message";
      case "file":
        return "📎 File";
      default:
        return "New attachment";
    }
  }

  return "New message";
};

const isValidCallType = (value: unknown): value is CallType =>
  value === "audio" || value === "video";

const getCallErrorMessage = (
  error: unknown,
  type: CallType,
): string => {
  const err = error as {
    name?: string;
    message?: string;
  };

  switch (err?.name) {
    case "NotFoundError":
    case "DevicesNotFoundError":
      return type === "video"
        ? "Camera or microphone was not found. Check that your camera and microphone are connected."
        : "No microphone was found. Connect a microphone or check your audio input device.";

    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Camera or microphone access was denied. Allow access in your browser's site settings and try again.";

    case "NotReadableError":
      return "Your camera or microphone may be in use by another application. Close that application and try again.";

    case "OverconstrainedError":
      return "Your camera or microphone does not support the requested settings.";

    case "AbortError":
      return "Camera or microphone access was interrupted. Please try again.";

    default:
      return err?.message || "Unable to access your camera or microphone.";
  }
};

export const formatCallDuration = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

// ======================================================
// HOOK
// ======================================================

export default function useChatSocket({
  conversationId,
  onTypingStart,
  onTypingStop,
  onUserBlocked,
  onUserUnblocked,
}: ChatSocketProps) {
  const dispatch = useAppDispatch();

  const token = useAppSelector((state) => state.auth.token);
  const currentUserId = useAppSelector((state) => state.auth.user?._id);

  // ====================================================
  // SOCKET REFS
  // ====================================================

  const socketRef = useRef<Socket | null>(null);
  const joinedConversationRef = useRef<string | null>(null);

  const conversationIdRef = useRef<string | null>(
    conversationId ? String(conversationId) : null,
  );

  const currentUserIdRef = useRef<string | undefined>(
    currentUserId ? String(currentUserId) : undefined,
  );

  const onTypingStartRef = useRef(onTypingStart);
  const onTypingStopRef = useRef(onTypingStop);
  const onUserBlockedRef = useRef(onUserBlocked);
  const onUserUnblockedRef = useRef(onUserUnblocked);

  useEffect(() => {
    conversationIdRef.current = conversationId
      ? String(conversationId)
      : null;
  }, [conversationId]);

  useEffect(() => {
    currentUserIdRef.current = currentUserId
      ? String(currentUserId)
      : undefined;
  }, [currentUserId]);

  useEffect(() => {
    onTypingStartRef.current = onTypingStart;
  }, [onTypingStart]);

  useEffect(() => {
    onTypingStopRef.current = onTypingStop;
  }, [onTypingStop]);

  useEffect(() => {
    onUserBlockedRef.current = onUserBlocked;
  }, [onUserBlocked]);

  useEffect(() => {
    onUserUnblockedRef.current = onUserUnblocked;
  }, [onUserUnblocked]);

  // ====================================================
  // CHAT SOUNDS + CALL RINGTONE
  // ====================================================

  const incomingAudioRef = useRef<HTMLAudioElement | null>(null);
  const notificationAudioRef = useRef<HTMLAudioElement | null>(null);
  const callRingtoneRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const incomingAudio = new Audio("/incoming.mp3");
    incomingAudio.preload = "auto";
    incomingAudio.volume = 0.55;

    const notificationAudio = new Audio("/notification.mp3");
    notificationAudio.preload = "auto";
    notificationAudio.volume = 0.55;

    const callRingtone = new Audio("/call_ringtone.mp3");
    callRingtone.preload = "auto";
    callRingtone.loop = true;
    callRingtone.volume = 0.8;

    incomingAudioRef.current = incomingAudio;
    notificationAudioRef.current = notificationAudio;
    callRingtoneRef.current = callRingtone;

    return () => {
      [incomingAudio, notificationAudio, callRingtone].forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });

      incomingAudioRef.current = null;
      notificationAudioRef.current = null;
      callRingtoneRef.current = null;
    };
  }, []);

  const playIncomingMessageSound = useCallback(() => {
    const audio = incomingAudioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;

      void audio.play().catch((error) => {
        console.warn("Unable to play incoming sound:", error);
      });
    } catch (error) {
      console.error("Incoming sound error:", error);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    const audio = notificationAudioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;

      void audio.play().catch((error) => {
        console.warn("Unable to play notification sound:", error);
      });
    } catch (error) {
      console.error("Notification sound error:", error);
    }
  }, []);

  // ====================================================
  // CHAT STATE REFS
  // ====================================================

  const pendingReadMessageIds = useRef<Set<string>>(new Set());
  const processedReactionEventsRef = useRef<Set<string>>(new Set());

  // ====================================================
  // WEBRTC STATE
  // ====================================================

  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callType, setCallType] = useState<CallType | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [lastCallDuration, setLastCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const activeCallIdRef = useRef<string | null>(null);
  const callTypeRef = useRef<CallType | null>(null);
  const callPeerIdRef = useRef<string | null>(null);
  const callStatusRef = useRef<CallStatus>("idle");

  const pendingIceCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const callStartedAtRef = useRef<number | null>(null);

  const updateCallStatus = useCallback((status: CallStatus) => {
    callStatusRef.current = status;
    setCallStatus(status);
  }, []);

  const getElapsedCallDuration = useCallback(() => {
    const startedAt = callStartedAtRef.current;

    if (startedAt === null) return 0;

    return Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
  }, []);

  // ====================================================
  // CALL DURATION TIMER
  // ====================================================

  useEffect(() => {
    if (callStatus !== "connected") return;

    if (callStartedAtRef.current === null) {
      callStartedAtRef.current = Date.now();
    }

    const updateDuration = () => {
      const startedAt = callStartedAtRef.current;
      if (startedAt === null) return;

      setCallDuration(
        Math.max(0, Math.floor((Date.now() - startedAt) / 1000)),
      );
    };

    updateDuration();

    const intervalId = window.setInterval(updateDuration, 1000);

    return () => window.clearInterval(intervalId);
  }, [callStatus]);

  // ====================================================
  // WEBRTC CLEANUP
  // ====================================================

  const stopCallMedia = useCallback(() => {
    const peer = peerConnectionRef.current;

    if (peer) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;

      try {
        peer.close();
      } catch (error) {
        console.warn("Error closing peer connection:", error);
      }
    }

    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    remoteStreamRef.current?.getTracks().forEach((track) => track.stop());

    localStreamRef.current = null;
    remoteStreamRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);

    pendingIceCandidatesRef.current = [];
    pendingOfferRef.current = null;
    callStartedAtRef.current = null;

    setCallDuration(0);
    setIsMicrophoneEnabled(true);
    setIsCameraEnabled(true);
  }, []);

  const resetCallState = useCallback(() => {
    const ringtone = callRingtoneRef.current;

    if (ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
    }

    stopCallMedia();

    activeCallIdRef.current = null;
    callTypeRef.current = null;
    callPeerIdRef.current = null;

    setActiveCallId(null);
    setCallType(null);
    setIncomingCall(null);
    setCallError(null);

    updateCallStatus("idle");
  }, [stopCallMedia, updateCallStatus]);

  // ====================================================
  // CALL RINGTONE CONTROL
  // ====================================================

  useEffect(() => {
    const audio = callRingtoneRef.current;
    if (!audio) return;

    const shouldRing =
      callStatus === "ringing" || callStatus === "calling";

    if (shouldRing) {
      audio.loop = true;

      if (audio.paused) {
        void audio.play().catch((error) => {
          console.warn("Unable to play call ringtone:", error);
        });
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [callStatus]);

  // ====================================================
  // CREATE PEER CONNECTION
  // ====================================================

  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
      ],
    });

    peer.onicecandidate = (event) => {
      if (!event.candidate) return;

      const socket = socketRef.current;
      const callId = activeCallIdRef.current;
      const targetUserId = callPeerIdRef.current;

      if (!socket?.connected || !callId || !targetUserId) return;

      socket.emit("call:ice-candidate", {
        callId,
        targetUserId,
        candidate: event.candidate.toJSON(),
      });
    };

    peer.ontrack = (event) => {
      let stream = event.streams[0];

      if (!stream) {
        stream = remoteStreamRef.current ?? new MediaStream();

        const alreadyAdded = stream
          .getTracks()
          .some((track) => track.id === event.track.id);

        if (!alreadyAdded) {
          stream.addTrack(event.track);
        }
      }

      remoteStreamRef.current = stream;
      setRemoteStream(stream);
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "connected") {
        callStartedAtRef.current ??= Date.now();
        updateCallStatus("connected");
      }

      if (peer.connectionState === "failed") {
        console.error("WebRTC connection failed.");

        const finalDuration = getElapsedCallDuration();
        setLastCallDuration(finalDuration);

        resetCallState();

        setCallError(
          "Call connection failed. Check your network and try again. Some networks may require a TURN server.",
        );
      }

      if (peer.connectionState === "disconnected") {
        console.warn("WebRTC peer temporarily disconnected.");
      }
    };

    peerConnectionRef.current = peer;

    return peer;
  }, [updateCallStatus, getElapsedCallDuration, resetCallState]);

  // ====================================================
  // GET LOCAL MEDIA
  // ====================================================

  const getCallMedia = useCallback(
    async (type: CallType): Promise<MediaStream> => {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        throw new Error(
          "Calls require HTTPS or localhost and a supported browser.",
        );
      }

      let stream: MediaStream | null = null;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === "video",
        });

        localStreamRef.current = stream;
        setLocalStream(stream);

        setIsMicrophoneEnabled(
          stream.getAudioTracks().some((track) => track.enabled),
        );

        setIsCameraEnabled(
          stream.getVideoTracks().some((track) => track.enabled),
        );

        const peer = createPeerConnection();

        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream!);
        });

        return stream;
      } catch (error) {
        stream?.getTracks().forEach((track) => track.stop());

        localStreamRef.current?.getTracks().forEach((track) => track.stop());

        localStreamRef.current = null;
        setLocalStream(null);

        const peer = peerConnectionRef.current;

        if (peer) {
          peer.onicecandidate = null;
          peer.ontrack = null;
          peer.onconnectionstatechange = null;

          try {
            peer.close();
          } catch (cleanupError) {
            console.warn("Peer cleanup error:", cleanupError);
          }
        }

        peerConnectionRef.current = null;
        remoteStreamRef.current?.getTracks().forEach((track) => track.stop());
        remoteStreamRef.current = null;
        setRemoteStream(null);

        throw error;
      }
    },
    [createPeerConnection],
  );

  // ====================================================
  // APPLY QUEUED ICE CANDIDATES
  // ====================================================

  const flushPendingIceCandidates = useCallback(
    async (peer: RTCPeerConnection) => {
      if (!peer.remoteDescription) return;

      const candidates = [...pendingIceCandidatesRef.current];
      pendingIceCandidatesRef.current = [];

      for (const candidate of candidates) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Unable to add queued ICE candidate:", error);
        }
      }
    },
    [],
  );

  // ====================================================
  // START CALL
  // ====================================================

  const startCall = useCallback(
    async (receiverId: string, type: CallType): Promise<boolean> => {
      const socket = socketRef.current;

      if (!socket?.connected) {
        setCallError("Socket is not connected. Please try again.");
        return false;
      }

      if (!receiverId || receiverId === String(currentUserIdRef.current)) {
        setCallError("Invalid call recipient.");
        return false;
      }

      if (!isValidCallType(type)) {
        setCallError("Invalid call type.");
        return false;
      }

      if (callStatusRef.current !== "idle") {
        setCallError("A call is already active.");
        return false;
      }

      try {
        setCallError(null);
        setCallDuration(0);
        setLastCallDuration(0);
        callStartedAtRef.current = null;

        callPeerIdRef.current = String(receiverId);
        callTypeRef.current = type;
        setCallType(type);

        await getCallMedia(type);

        if (!socket.connected || socketRef.current !== socket) {
          throw new Error(
            "Socket disconnected while preparing the call. Please try again.",
          );
        }

        updateCallStatus("calling");

        socket.emit("call:initiate", {
          receiverId: String(receiverId),
          type,
        });

        return true;
      } catch (error) {
        console.error("Failed to start call:", error);

        const message = getCallErrorMessage(error, type);

        resetCallState();
        setCallError(message);

        return false;
      }
    },
    [getCallMedia, resetCallState, updateCallStatus],
  );

  // ====================================================
  // ACCEPT CALL
  // ====================================================

  const acceptCall = useCallback(async (): Promise<boolean> => {
    const socket = socketRef.current;
    const call = incomingCall;

    if (!socket?.connected || !call) {
      setCallError("No incoming call is available.");
      return false;
    }

    try {
      setCallError(null);
      setCallDuration(0);
      callStartedAtRef.current = null;

      activeCallIdRef.current = call.callId;
      callPeerIdRef.current = String(call.callerId);
      callTypeRef.current = call.type;

      setActiveCallId(call.callId);
      setCallType(call.type);

      await getCallMedia(call.type);

      if (!socket.connected || socketRef.current !== socket) {
        throw new Error("Socket disconnected while accepting the call.");
      }

      socket.emit("call:accept", {
        callId: call.callId,
        callerId: call.callerId,
      });

      updateCallStatus("connecting");

      const pendingOffer = pendingOfferRef.current;

      if (pendingOffer) {
        pendingOfferRef.current = null;

        const peer = peerConnectionRef.current;

        if (peer) {
          await peer.setRemoteDescription(
            new RTCSessionDescription(pendingOffer),
          );

          await flushPendingIceCandidates(peer);

          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);

          socket.emit("call:answer", {
            callId: call.callId,
            callerId: call.callerId,
            answer: peer.localDescription,
          });
        }
      }

      return true;
    } catch (error) {
      console.error("Failed to accept call:", error);

      const message = getCallErrorMessage(error, call.type);

      if (socket.connected) {
        socket.emit("call:reject", {
          callId: call.callId,
          callerId: call.callerId,
        });
      }

      setLastCallDuration(0);
      resetCallState();

      // Set the error after resetCallState because reset clears it.
      setCallError(message);

      return false;
    }
  }, [
    incomingCall,
    getCallMedia,
    flushPendingIceCandidates,
    updateCallStatus,
    resetCallState,
  ]);

  // ====================================================
  // REJECT CALL
  // ====================================================

  const rejectCall = useCallback(() => {
    const socket = socketRef.current;
    const call = incomingCall;

    if (!socket?.connected || !call) return false;

    socket.emit("call:reject", {
      callId: call.callId,
      callerId: call.callerId,
    });

    setLastCallDuration(0);
    resetCallState();

    return true;
  }, [incomingCall, resetCallState]);

  // ====================================================
  // CANCEL OUTGOING CALL
  // ====================================================

  const cancelCall = useCallback(() => {
    const socket = socketRef.current;
    const callId = activeCallIdRef.current;
    const receiverId = callPeerIdRef.current;

    const finalDuration = getElapsedCallDuration();

    if (socket?.connected && callId && receiverId) {
      socket.emit("call:cancel", { callId, receiverId });
    }

    setLastCallDuration(finalDuration);
    resetCallState();

    return true;
  }, [getElapsedCallDuration, resetCallState]);

  // ====================================================
  // END CALL
  // ====================================================

  const endCall = useCallback(() => {
    const socket = socketRef.current;
    const callId = activeCallIdRef.current;
    const targetUserId = callPeerIdRef.current;

    const finalDuration = getElapsedCallDuration();

    if (socket?.connected && callId && targetUserId) {
      socket.emit("call:end", { callId, targetUserId });
    }

    setLastCallDuration(finalDuration);
    resetCallState();
  }, [getElapsedCallDuration, resetCallState]);

  // ====================================================
  // TOGGLE MICROPHONE
  // ====================================================

  const toggleMicrophone = useCallback(() => {
    const tracks = localStreamRef.current?.getAudioTracks() ?? [];
    if (!tracks.length) return;

    const enabled = !tracks.some((track) => track.enabled);

    tracks.forEach((track) => {
      track.enabled = enabled;
    });

    setIsMicrophoneEnabled(enabled);
  }, []);

  // ====================================================
  // TOGGLE CAMERA
  // ====================================================

  const toggleCamera = useCallback(() => {
    const tracks = localStreamRef.current?.getVideoTracks() ?? [];
    if (!tracks.length) return;

    const enabled = !tracks.some((track) => track.enabled);

    tracks.forEach((track) => {
      track.enabled = enabled;
    });

    setIsCameraEnabled(enabled);
  }, []);

  // ====================================================
  // MARK SINGLE MESSAGE AS READ
  // ====================================================

  const markMessageAsRead = useCallback((messageId: string) => {
    if (!messageId) return;

    const normalizedId = String(messageId);
    const socket = socketRef.current;

    if (!socket?.connected) {
      pendingReadMessageIds.current.add(normalizedId);
      return;
    }

    socket.emit("message:read", { messageId: normalizedId });
  }, []);

  // ====================================================
  // MARK CONVERSATION AS READ
  // ====================================================

  const markConversationAsRead = useCallback(
    (id: string | null) => {
      const normalizedId = normalizeId(id);
      if (!normalizedId) return;

      dispatch(
        conversationApi.util.updateQueryData(
          "getConversations",
          undefined,
          (draft) => {
            const conversation = draft.find(
              (item) => String(item._id) === normalizedId,
            );

            if (conversation) conversation.unreadCount = 0;
          },
        ),
      );

      const socket = socketRef.current;
      if (!socket?.connected) return;

      socket.emit("conversation:read", {
        conversationId: normalizedId,
      });
    },
    [dispatch],
  );

  // ====================================================
  // JOIN CONVERSATION
  // ====================================================

  const joinConversation = useCallback(
    (id: string | null) => {
      const socket = socketRef.current;
      if (!socket?.connected) return false;

      const normalizedId = normalizeId(id);
      if (!normalizedId) return false;

      const alreadyJoined = joinedConversationRef.current;

      if (alreadyJoined === normalizedId) {
        markConversationAsRead(normalizedId);
        return true;
      }

      if (alreadyJoined) {
        socket.emit("conversation:leave", {
          conversationId: alreadyJoined,
        });
      }

      joinedConversationRef.current = null;

      socket.emit("conversation:join", {
        conversationId: normalizedId,
      });

      return true;
    },
    [markConversationAsRead],
  );

  // ====================================================
  // DISCONNECT SOCKET
  // ====================================================

  const disconnectSocket = useCallback(() => {
    const socket = socketRef.current;

    if (socket) {
      const joinedConversation = joinedConversationRef.current;

      if (joinedConversation && socket.connected) {
        socket.emit("conversation:leave", {
          conversationId: joinedConversation,
        });
      }

      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    }

    joinedConversationRef.current = null;
    pendingReadMessageIds.current.clear();

    resetCallState();
  }, [resetCallState]);

  // ====================================================
  // SOCKET CONNECTION + EVENT LISTENERS
  // ====================================================

  useEffect(() => {
    if (!token || !currentUserId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    const socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    });

    socketRef.current = socket;

    // CONNECT
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      const currentConversation = conversationIdRef.current;

      if (currentConversation) joinConversation(currentConversation);

      if (pendingReadMessageIds.current.size > 0) {
        const pendingIds = Array.from(pendingReadMessageIds.current);

        pendingIds.forEach((messageId) => {
          socket.emit("message:read", { messageId });
        });

        pendingReadMessageIds.current.clear();
      }
    });

    socket.io.on("reconnect_attempt", (attempt) => {
      console.log("Socket reconnect attempt:", attempt);
    });

    socket.io.on("reconnect", () => {
      const currentConversation = conversationIdRef.current;
      if (currentConversation) joinConversation(currentConversation);
    });

    socket.io.on("reconnect_error", (error) => {
      console.error("Socket reconnect error:", error.message);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    // CONVERSATION EVENTS
    socket.on(
      "conversation:joined",
      ({ conversationId: joinedId }: { conversationId: string }) => {
        const normalizedId = normalizeId(joinedId);
        if (!normalizedId) return;

        joinedConversationRef.current = normalizedId;

        if (conversationIdRef.current === normalizedId) {
          markConversationAsRead(normalizedId);
        }
      },
    );

    socket.on(
      "conversation:left",
      ({ conversationId: leftId }: { conversationId: string }) => {
        const normalizedId = normalizeId(leftId);

        if (
          normalizedId &&
          joinedConversationRef.current === normalizedId
        ) {
          joinedConversationRef.current = null;
        }
      },
    );

    socket.on("conversation:error", (error: ConversationError) => {
      console.error("Conversation error:", error);

      if (
        error.conversationId &&
        joinedConversationRef.current === String(error.conversationId)
      ) {
        joinedConversationRef.current = null;
      }
    });

    socket.on("conversation:read:update", (data: ConversationReadUpdate) => {
      const conversationId = normalizeId(data.conversationId);
      const userId = normalizeId(data.userId);

      if (!conversationId || !userId) return;

      if (String(currentUserIdRef.current) === userId) {
        dispatch(
          conversationApi.util.updateQueryData(
            "getConversations",
            undefined,
            (draft) => {
              const conversation = draft.find(
                (item) => String(item._id) === conversationId,
              );

              if (conversation) conversation.unreadCount = 0;
            },
          ),
        );
      }

      if (Array.isArray(data.messageIds) && data.messageIds.length) {
        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            { conversationId, page: 1, limit: 30 },
            (draft) => {
              data.messageIds.forEach((id) => {
                const message = draft.messages.find(
                  (item) => String(item._id) === String(id),
                );

                if (!message) return;

                message.readBy ??= [];

                if (!message.readBy.some((value) => String(value) === userId)) {
                  message.readBy.push(userId);
                }
              });
            },
          ),
        );
      }
    });

    // BLOCK / UNBLOCK
    socket.on("user:blocked", (data: UserBlockedEvent) => {
      if (String(data.blockedId) !== String(currentUserIdRef.current)) return;

      onUserBlockedRef.current?.({
        blockerId: String(data.blockerId),
        blockedId: String(data.blockedId),
      });
    });

    socket.on("user:unblocked", (data: UserUnblockedEvent) => {
      if (String(data.blockedId) !== String(currentUserIdRef.current)) return;

      onUserUnblockedRef.current?.({
        blockerId: String(data.blockerId),
        blockedId: String(data.blockedId),
      });
    });

    // NEW MESSAGE
    socket.on("message:new", (message: Message) => {
      const messageId = normalizeId(message._id);
      const messageConversationId = normalizeId(message.conversationId);

      if (!messageId || !messageConversationId) return;

      const isSystemMessage = message.type === "system";
      const selectedConversationId = conversationIdRef.current
        ? String(conversationIdRef.current)
        : null;

      const senderId = normalizeId(message.senderId);
      const currentId = currentUserIdRef.current
        ? String(currentUserIdRef.current)
        : null;

      const isOwnMessage =
        senderId !== null && currentId !== null && senderId === currentId;

      const isCurrentConversation =
        messageConversationId === selectedConversationId;

      if (!isSystemMessage && !isOwnMessage) {
        if (isCurrentConversation) {
          playIncomingMessageSound();
        } else {
          playNotificationSound();
        }
      }

      const sender = getPopulatedSender(message);

      if (!isSystemMessage && !isOwnMessage && !isCurrentConversation) {
        emitChatNotification({
          title: sender?.name || "New Message",
          body: getNotificationBody(message),
          conversationId: messageConversationId,
          messageId,
          senderId,
          senderAvatar: sender?.avatar || sender?.avatarUrl || null,
        });
      }

      if (!isSystemMessage && senderId && !isOwnMessage) {
        socket.emit("message:delivered", { messageId });
      }

      if (
        !isSystemMessage &&
        senderId &&
        !isOwnMessage &&
        isCurrentConversation
      ) {
        markMessageAsRead(messageId);
      }

      dispatch(
        messageApi.util.updateQueryData(
          "getMessages",
          { conversationId: messageConversationId, page: 1, limit: 30 },
          (draft) => {
            const exists = draft.messages.some(
              (item) => String(item._id) === messageId,
            );

            if (exists) return;

            draft.messages.push(message);

            draft.messages.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );
          },
        ),
      );

      dispatch(
        conversationApi.util.updateQueryData(
          "getConversations",
          undefined,
          (draft) => {
            const conversation = draft.find(
              (item) => String(item._id) === messageConversationId,
            );

            if (!conversation) {
              dispatch(
                conversationApi.util.invalidateTags(["Conversation"]),
              );
              return;
            }

            conversation.lastMessage =
              message as typeof conversation.lastMessage;

            conversation.updatedAt = message.updatedAt || message.createdAt;

            if (
              !isSystemMessage &&
              !isOwnMessage &&
              !isCurrentConversation
            ) {
              conversation.unreadCount =
                (conversation.unreadCount || 0) + 1;
            }

            const index = draft.findIndex(
              (item) => String(item._id) === messageConversationId,
            );

            if (index > 0) {
              const [updated] = draft.splice(index, 1);
              if (updated) draft.unshift(updated);
            }
          },
        ),
      );
    });

    // DELIVERY UPDATE
    socket.on(
      "message:delivery:update",
      ({
        messageId,
        conversationId: deliveryConversationId,
        userId,
      }: {
        messageId: string;
        conversationId: string;
        userId: string;
      }) => {
        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId: String(deliveryConversationId),
              page: 1,
              limit: 30,
            },
            (draft) => {
              const message = draft.messages.find(
                (item) => String(item._id) === String(messageId),
              );

              if (!message) return;

              message.deliveredTo ??= [];

              if (!message.deliveredTo.some((id) => String(id) === String(userId))) {
                message.deliveredTo.push(userId);
              }
            },
          ),
        );
      },
    );

    // SINGLE MESSAGE READ UPDATE
    socket.on(
      "message:read:update",
      ({
        messageId,
        conversationId: readConversationId,
        userId,
      }: {
        messageId: string;
        conversationId: string;
        userId: string;
      }) => {
        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId: String(readConversationId),
              page: 1,
              limit: 30,
            },
            (draft) => {
              const message = draft.messages.find(
                (item) => String(item._id) === String(messageId),
              );

              if (!message) return;

              message.readBy ??= [];

              if (!message.readBy.some((id) => String(id) === String(userId))) {
                message.readBy.push(userId);
              }
            },
          ),
        );
      },
    );

    // MESSAGE EDITED
    socket.on("message:edited", (message: Message) => {
      const id = normalizeId(message.conversationId);
      if (!id) return;

      dispatch(
        messageApi.util.updateQueryData(
          "getMessages",
          { conversationId: id, page: 1, limit: 30 },
          (draft) => {
            const existing = draft.messages.find(
              (item) => String(item._id) === String(message._id),
            );

            if (!existing) return;

            existing.text = message.text;
            existing.isEdited = message.isEdited;
            existing.updatedAt = message.updatedAt;
          },
        ),
      );
    });

    // MESSAGE DELETED
    socket.on(
      "message:deleted",
      ({
        messageId,
        conversationId: deletedConversationId,
        isDeleted,
        deletedAt,
      }: {
        messageId: string;
        conversationId: string;
        isDeleted: boolean;
        deletedAt?: string | null;
      }) => {
        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId: String(deletedConversationId),
              page: 1,
              limit: 30,
            },
            (draft) => {
              const message = draft.messages.find(
                (item) => String(item._id) === String(messageId),
              );

              if (!message) return;

              message.isDeleted = isDeleted;
              message.deletedAt = deletedAt ?? null;
              message.text = "";
              message.attachments = [];
              message.reactions = [];
            },
          ),
        );
      },
    );

    // REACTION UPDATE
    socket.on("message:reaction:update", (data: MessageReactionUpdate) => {
      const {
        eventId,
        messageId,
        conversationId: reactionConversationId,
        action,
        reactorId,
        reactionSummary,
      } = data;

      if (!messageId || !reactionConversationId) return;

      if (eventId) {
        if (processedReactionEventsRef.current.has(eventId)) return;

        processedReactionEventsRef.current.add(eventId);

        if (processedReactionEventsRef.current.size > 1000) {
          const first = processedReactionEventsRef.current.values().next().value;
          if (first) processedReactionEventsRef.current.delete(first);
        }
      }

      const normalizedConversationId = String(reactionConversationId);
      const selectedConversationId = conversationIdRef.current
        ? String(conversationIdRef.current)
        : null;

      const currentId = currentUserIdRef.current
        ? String(currentUserIdRef.current)
        : null;

      const normalizedReactorId = reactorId ? String(reactorId) : null;

      const isOwnReaction =
        normalizedReactorId !== null &&
        currentId !== null &&
        normalizedReactorId === currentId;

      const isCurrentConversation =
        normalizedConversationId === selectedConversationId;

      if (!isOwnReaction) {
        if (isCurrentConversation) {
          playIncomingMessageSound();
        } else {
          playNotificationSound();
        }
      }

      if (!isOwnReaction && !isCurrentConversation) {
        emitChatNotification({
          title: "Message reaction",
          body:
            action === "removed"
              ? "Someone removed a reaction"
              : "Someone reacted to your message",
          conversationId: normalizedConversationId,
          messageId: String(messageId),
          senderId: normalizedReactorId,
          senderAvatar: null,
        });
      }

      let messageWasCached = false;

      dispatch(
        messageApi.util.updateQueryData(
          "getMessages",
          {
            conversationId: normalizedConversationId,
            page: 1,
            limit: 30,
          },
          (draft) => {
            const message = draft.messages.find(
              (item) => String(item._id) === String(messageId),
            );

            if (!message) return;

            messageWasCached = true;
            message.reactions = reactionSummary;
          },
        ),
      );

      if (!messageWasCached) {
        void dispatch(
          messageApi.endpoints.getMessages.initiate(
            {
              conversationId: normalizedConversationId,
              page: 1,
              limit: 30,
            },
            { forceRefetch: true, subscribe: false },
          ),
        );
      }
    });

    // TYPING START
    socket.on(
      "typing:start",
      ({
        conversationId: typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        if (
          String(typingConversationId) !== String(conversationIdRef.current) ||
          String(userId) === String(currentUserIdRef.current)
        ) {
          return;
        }

        onTypingStartRef.current?.(String(userId));
      },
    );

    // TYPING STOP
    socket.on(
      "typing:stop",
      ({
        conversationId: typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        if (
          String(typingConversationId) !== String(conversationIdRef.current) ||
          String(userId) === String(currentUserIdRef.current)
        ) {
          return;
        }

        onTypingStopRef.current?.(String(userId));
      },
    );

    // ==================================================
    // WEBRTC: INCOMING CALL
    // ==================================================

    socket.on("call:incoming", (data: IncomingCall) => {
      if (
        !data?.callId ||
        !data.callerId ||
        !data.receiverId ||
        !isValidCallType(data.type)
      ) {
        return;
      }

      const currentId = String(currentUserIdRef.current ?? "");

      // Backend may send the incoming event to the caller too.
      if (String(data.callerId) === currentId) {
        activeCallIdRef.current = data.callId;
        callPeerIdRef.current = String(data.receiverId);
        callTypeRef.current = data.type;

        setActiveCallId(data.callId);
        setCallType(data.type);
        return;
      }

      if (String(data.receiverId) !== currentId) return;

      if (callStatusRef.current !== "idle") {
        socket.emit("call:reject", {
          callId: data.callId,
          callerId: data.callerId,
        });
        return;
      }

      activeCallIdRef.current = data.callId;
      callPeerIdRef.current = String(data.callerId);
      callTypeRef.current = data.type;

      setActiveCallId(data.callId);
      setCallType(data.type);
      setIncomingCall(data);

      updateCallStatus("ringing");
    });

    // CALL ACCEPTED
    socket.on("call:accepted", async (data: CallParticipantPayload) => {
      if (data.callId !== activeCallIdRef.current) return;

      const currentId = String(currentUserIdRef.current ?? "");
      const isCaller = String(data.callerId) === currentId;

      callPeerIdRef.current = isCaller
        ? String(data.receiverId)
        : String(data.callerId);

      setActiveCallId(data.callId);
      updateCallStatus("connecting");

      if (!isCaller) return;

      try {
        const peer = peerConnectionRef.current ?? createPeerConnection();

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);

        socket.emit("call:offer", {
          callId: data.callId,
          receiverId: String(data.receiverId),
          offer: peer.localDescription,
        });
      } catch (error) {
        console.error("Failed to create call offer:", error);
        setCallError("Could not start call negotiation.");
      }
    });

    // RECEIVE OFFER
    socket.on("call:offer", async (data: CallOfferPayload) => {
      if (data.callId !== activeCallIdRef.current) return;

      if (!localStreamRef.current) {
        pendingOfferRef.current = data.offer;
        return;
      }

      try {
        const peer = peerConnectionRef.current ?? createPeerConnection();

        await peer.setRemoteDescription(
          new RTCSessionDescription(data.offer),
        );

        await flushPendingIceCandidates(peer);

        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);

        const callerId = data.callerId || callPeerIdRef.current;

        if (!callerId) {
          throw new Error("Caller ID is missing from the active call.");
        }

        socket.emit("call:answer", {
          callId: data.callId,
          callerId,
          answer: peer.localDescription,
        });
      } catch (error) {
        console.error("Failed to handle call offer:", error);
        setCallError("Could not process the call offer.");
      }
    });

    // RECEIVE ANSWER
    socket.on("call:answer", async (data: CallAnswerPayload) => {
      if (data.callId !== activeCallIdRef.current) return;

      try {
        const peer = peerConnectionRef.current;

        if (!peer) {
          setCallError("Call connection is not ready.");
          return;
        }

        if (peer.signalingState !== "have-local-offer") {
          console.warn(
            "Ignoring call answer in signaling state:",
            peer.signalingState,
          );
          return;
        }

        await peer.setRemoteDescription(
          new RTCSessionDescription(data.answer),
        );

        await flushPendingIceCandidates(peer);
      } catch (error) {
        console.error("Failed to handle call answer:", error);
        setCallError("Could not complete call negotiation.");
      }
    });

    // ICE CANDIDATE
    socket.on("call:ice-candidate", async (data: CallIcePayload) => {
      if (data.callId !== activeCallIdRef.current || !data.candidate) return;

      const peer = peerConnectionRef.current;

      if (!peer || !peer.remoteDescription) {
        pendingIceCandidatesRef.current.push(data.candidate);
        return;
      }

      try {
        await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error("Failed to add ICE candidate:", error);
      }
    });

    // CALL ENDED / REJECTED / CANCELLED
    const handleCallFinished = (data: CallParticipantPayload) => {
      if (!data?.callId || data.callId !== activeCallIdRef.current) return;

      const locallyMeasuredDuration = getElapsedCallDuration();

      const finalDuration =
        typeof data.duration === "number" && data.duration > 0
          ? Math.floor(data.duration)
          : locallyMeasuredDuration;

      setLastCallDuration(finalDuration);
      resetCallState();
    };

    socket.on("call:rejected", handleCallFinished);
    socket.on("call:cancelled", handleCallFinished);
    socket.on("call:ended", handleCallFinished);

    // CALL ERROR
    socket.on("call:error", (error: CallErrorPayload) => {
      if (
        error.callId &&
        activeCallIdRef.current &&
        error.callId !== activeCallIdRef.current
      ) {
        return;
      }

      const message = error.message || "A calling error occurred.";

      const finalDuration = getElapsedCallDuration();
      setLastCallDuration(finalDuration);

      resetCallState();

      // resetCallState clears errors, so set this afterwards.
      setCallError(message);
    });

    // DISCONNECT
    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      joinedConversationRef.current = null;

      if (callStatusRef.current !== "idle") {
        setLastCallDuration(getElapsedCallDuration());
        resetCallState();
        setCallError("Call ended because the socket disconnected.");
      }
    });

    // CLEANUP
    return () => {
      const joinedConversation = joinedConversationRef.current;

      if (joinedConversation && socket.connected) {
        socket.emit("conversation:leave", {
          conversationId: joinedConversation,
        });
      }

      socket.removeAllListeners();
      socket.io.removeAllListeners();
      socket.disconnect();

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      joinedConversationRef.current = null;
      resetCallState();
    };
  }, [
    token,
    currentUserId,
    dispatch,
    joinConversation,
    markConversationAsRead,
    markMessageAsRead,
    playIncomingMessageSound,
    playNotificationSound,
    createPeerConnection,
    flushPendingIceCandidates,
    resetCallState,
    updateCallStatus,
    getElapsedCallDuration,
  ]);

  // ====================================================
  // CHANGE CONVERSATION
  // ====================================================

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    joinConversation(conversationId);
  }, [conversationId, joinConversation]);

  // ====================================================
  // SEND TYPING START
  // ====================================================

  const sendTypingStart = useCallback(() => {
    const socket = socketRef.current;
    const selectedConversationId = conversationIdRef.current;

    if (!socket?.connected || !selectedConversationId) return;

    socket.emit("typing:start", {
      conversationId: selectedConversationId,
    });
  }, []);

  // ====================================================
  // SEND TYPING STOP
  // ====================================================

  const sendTypingStop = useCallback(() => {
    const socket = socketRef.current;
    const selectedConversationId = conversationIdRef.current;

    if (!socket?.connected || !selectedConversationId) return;

    socket.emit("typing:stop", {
      conversationId: selectedConversationId,
    });
  }, []);

  // ====================================================
  // DELETE MESSAGE
  // ====================================================

  const deleteMessageRealtime = useCallback((messageId: string) => {
    const socket = socketRef.current;

    if (!socket?.connected) {
      console.error("Socket is not connected. Cannot delete message.");
      return false;
    }

    if (!messageId) return false;

    socket.emit("message:delete", { messageId: String(messageId) });
    return true;
  }, []);

  // ====================================================
  // EDIT MESSAGE
  // ====================================================

  const editMessageRealtime = useCallback(
    (messageId: string, text: string) => {
      const socket = socketRef.current;

      if (!socket?.connected) {
        console.error("Socket is not connected. Cannot edit message.");
        return false;
      }

      const trimmedText = text.trim();
      if (!messageId || !trimmedText) return false;

      socket.emit("message:edit", {
        messageId: String(messageId),
        text: trimmedText,
      });

      return true;
    },
    [],
  );

  // ====================================================
  // REACTION
  // ====================================================

  const toggleMessageReactionRealtime = useCallback(
    (messageId: string, emoji: string) => {
      const socket = socketRef.current;

      if (!socket?.connected) {
        console.error("Socket is not connected. Cannot react to message.");
        return false;
      }

      if (!messageId || !emoji) return false;

      socket.emit("message:reaction", {
        messageId: String(messageId),
        emoji,
      });

      return true;
    },
    [],
  );

  // ====================================================
  // RETURN
  // ====================================================

  return {
    // Existing chat API
    socket: socketRef.current,
    sendTypingStart,
    sendTypingStop,
    markMessageAsRead,
    markConversationAsRead,
    deleteMessageRealtime,
    editMessageRealtime,
    toggleMessageReactionRealtime,
    disconnectSocket,
    playIncomingMessageSound,

    // WebRTC call state
    callStatus,
    incomingCall,
    activeCallId,
    callType,
    localStream,
    remoteStream,
    callError,
    isMicrophoneEnabled,
    isCameraEnabled,

    // Call duration
    callDuration,
    lastCallDuration,
    formatCallDuration,

    // WebRTC actions
    startCall,
    acceptCall,
    rejectCall,
    cancelCall,
    endCall,
    toggleMicrophone,
    toggleCamera,
  };
}
