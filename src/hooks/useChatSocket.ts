"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";

import { messageApi } from "@/src/redux/features/message/messageApi";

import type { Message } from "@/src/redux/features/message/message.types";

// ======================================================
// TYPES
// ======================================================

interface ChatSocketProps {
  conversationId: string | null;

  onTypingStart?: (userId: string) => void;

  onTypingStop?: (userId: string) => void;
}

// ======================================================
// HOOK
// ======================================================

export default function useChatSocket({
  conversationId,
  onTypingStart,
  onTypingStop,
}: ChatSocketProps) {
  const dispatch = useAppDispatch();

  // ====================================================
  // AUTH
  // ====================================================

  const token = useAppSelector((state) => state.auth.token);

  const currentUserId = useAppSelector((state) => state.auth.user?._id);

  // ====================================================
  // SOCKET REF
  // ====================================================

  const socketRef = useRef<Socket | null>(null);

  const joinedConversationRef = useRef<string | null>(null);

  // ====================================================
  // SOCKET CONNECTION
  // ====================================================

  useEffect(() => {
    if (!token) {
      return;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    // ==================================================
    // CREATE SOCKET
    // ==================================================

    const socket = io(socketUrl, {
      auth: {
        token,
      },

      withCredentials: true,
    });

    socketRef.current = socket;

    // ==================================================
    // SOCKET CONNECT
    // ==================================================

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      // ----------------------------------------------
      // Join selected conversation
      // ----------------------------------------------

      if (conversationId) {
        socket.emit("conversation:join", {
          conversationId,
        });

        joinedConversationRef.current = conversationId;

        console.log("Joining conversation:", conversationId);
      }
    });

    // ==================================================
    // CONVERSATION JOINED
    // ==================================================

    socket.on(
      "conversation:joined",
      ({ conversationId: joinedConversationId }) => {
        console.log("Conversation joined:", joinedConversationId);
      },
    );

    // ==================================================
    // CONVERSATION ERROR
    // ==================================================

    socket.on("conversation:error", (error) => {
      console.error("Conversation error:", error);
    });

    // ==================================================
    // NEW MESSAGE
    // ==================================================

    socket.on("message:new", (message: Message) => {
      console.log("REALTIME MESSAGE RECEIVED:", message);

      // --------------------------------------------
      // Ignore messages from another conversation
      // --------------------------------------------

      if (message.conversationId !== conversationId) {
        return;
      }

      // --------------------------------------------
      // Get sender ID
      // --------------------------------------------

      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id;

      // --------------------------------------------
      // Mark incoming message as delivered
      //
      // IMPORTANT:
      // We only mark messages from OTHER users.
      // --------------------------------------------

      if (senderId && senderId !== currentUserId) {
        socket.emit("message:delivered", {
          messageId: message._id,
        });

        console.log("Marking message as delivered:", message._id);
      }

      // --------------------------------------------
      // Update RTK Query cache
      // --------------------------------------------

      dispatch(
        messageApi.util.updateQueryData(
          "getMessages",
          {
            conversationId: conversationId!,
            page: 1,
            limit: 30,
          },
          (draft) => {
            // --------------------------------------
            // Prevent duplicate message
            // --------------------------------------

            const exists = draft.messages.some(
              (existingMessage) => existingMessage._id === message._id,
            );

            if (exists) {
              return;
            }

            // --------------------------------------
            // Add message
            // --------------------------------------

            draft.messages.push(message);

            // --------------------------------------
            // Keep chronological order
            // --------------------------------------

            draft.messages.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );
          },
        ),
      );
    });

    // ==================================================
    // MESSAGE DELIVERY UPDATE
    // ==================================================

    socket.on(
      "message:delivery:update",
      ({ messageId, userId }: { messageId: string; userId: string }) => {
        console.log("MESSAGE DELIVERY UPDATE:", {
          messageId,
          userId,
        });

        // --------------------------------------------
        // No selected conversation
        // --------------------------------------------

        if (!conversationId) {
          return;
        }

        // --------------------------------------------
        // Update message cache
        // --------------------------------------------

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId,
              page: 1,
              limit: 30,
            },
            (draft) => {
              const message = draft.messages.find(
                (item) => item._id === messageId,
              );

              if (!message) {
                return;
              }

              // ------------------------------------
              // Initialize deliveredTo
              // ------------------------------------

              if (!message.deliveredTo) {
                message.deliveredTo = [];
              }

              // ------------------------------------
              // Check duplicate
              // ------------------------------------

              if (!message.deliveredTo) {
                message.deliveredTo = [];
              }

              const alreadyDelivered = message.deliveredTo.some(
                (id) => id === userId,
              );

              if (!alreadyDelivered) {
                message.deliveredTo.push(userId);
              }

              if (alreadyDelivered) {
                return;
              }

              // ------------------------------------
              // Add delivered user
              // ------------------------------------

              message.deliveredTo.push(userId);
            },
          ),
        );
      },
    );

    // ==================================================
    // TYPING START
    // ==================================================

    socket.on(
      "typing:start",
      ({
        conversationId: typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        // --------------------------------------------
        // Wrong conversation
        // --------------------------------------------

        if (typingConversationId !== conversationId) {
          return;
        }

        // --------------------------------------------
        // IMPORTANT:
        // Ignore our own typing event
        // --------------------------------------------

        if (userId === currentUserId) {
          return;
        }

        console.log("USER STARTED TYPING:", userId);

        onTypingStart?.(userId);
      },
    );

    // ==================================================
    // TYPING STOP
    // ==================================================

    socket.on(
      "typing:stop",
      ({
        conversationId: typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        // --------------------------------------------
        // Wrong conversation
        // --------------------------------------------

        if (typingConversationId !== conversationId) {
          return;
        }

        // --------------------------------------------
        // Ignore our own typing event
        // --------------------------------------------

        if (userId === currentUserId) {
          return;
        }

        console.log("USER STOPPED TYPING:", userId);

        onTypingStop?.(userId);
      },
    );

    // ==================================================
    // SOCKET CONNECTION ERROR
    // ==================================================

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    // ==================================================
    // SOCKET DISCONNECT
    // ==================================================

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {
      // --------------------------------------------
      // Leave conversation
      // --------------------------------------------

      if (joinedConversationRef.current) {
        socket.emit("conversation:leave", {
          conversationId: joinedConversationRef.current,
        });
      }

      // --------------------------------------------
      // Remove socket listeners
      // --------------------------------------------

      socket.removeAllListeners();

      // --------------------------------------------
      // Disconnect socket
      // --------------------------------------------

      socket.disconnect();

      // --------------------------------------------
      // Reset refs
      // --------------------------------------------

      socketRef.current = null;

      joinedConversationRef.current = null;
    };
  }, [
    token,
    currentUserId,
    conversationId,
    dispatch,
    onTypingStart,
    onTypingStop,
  ]);

  // ======================================================
  // SEND TYPING START
  // ======================================================

  const sendTypingStart = () => {
    const socket = socketRef.current;

    if (!socket || !conversationId) {
      return;
    }

    socket.emit("typing:start", {
      conversationId,
    });
  };

  // ======================================================
  // SEND TYPING STOP
  // ======================================================

  const sendTypingStop = () => {
    const socket = socketRef.current;

    if (!socket || !conversationId) {
      return;
    }

    socket.emit("typing:stop", {
      conversationId,
    });
  };

  // ======================================================
  // RETURN
  // ======================================================

  return {
    socket: socketRef.current,

    sendTypingStart,

    sendTypingStop,
  };
}
