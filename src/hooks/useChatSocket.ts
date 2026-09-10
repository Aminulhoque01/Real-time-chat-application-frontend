"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";

import { messageApi } from "@/src/redux/features/message/messageApi";
import { conversationApi } from "@/src/redux/features/conversation/conversationApi";

import type { Message } from "@/src/redux/features/message/message.types";

interface ChatSocketProps {
  conversationId: string | null;

  onTypingStart?: (userId: string) => void;

  onTypingStop?: (userId: string) => void;
}

export default function useChatSocket({
  conversationId,
  onTypingStart,
  onTypingStop,
}: ChatSocketProps) {
  const dispatch = useAppDispatch();

  // ==========================================
  // AUTH
  // ==========================================

  const token = useAppSelector((state) => state.auth.token);

  const currentUserId = useAppSelector((state) => state.auth.user?._id);

  // ==========================================
  // SOCKET
  // ==========================================

  const socketRef = useRef<Socket | null>(null);

  const joinedConversationRef = useRef<string | null>(null);

  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    if (!token || !currentUserId) {
      return;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000";

    const socket = io(socketUrl, {
      auth: {
        token,
      },

      withCredentials: true,
    });

    socketRef.current = socket;

    // ========================================
    // CONNECT
    // ========================================

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);

      // --------------------------------------
      // Join selected conversation
      // --------------------------------------

      if (conversationId) {
        socket.emit("conversation:join", {
          conversationId,
        });

        joinedConversationRef.current = conversationId;

        console.log("Joining conversation:", conversationId);
      }

      // --------------------------------------
      // Personal room
      // --------------------------------------
      //
      // Backend automatically joins:
      //
      // user:${currentUserId}
      //
      // No frontend join required.
      // --------------------------------------
    });

    // ========================================
    // CONVERSATION JOINED
    // ========================================

    socket.on(
      "conversation:joined",
      ({ conversationId: joinedConversationId }) => {
        console.log("Conversation joined:", joinedConversationId);
      },
    );

    // ========================================
    // CONVERSATION ERROR
    // ========================================

    socket.on("conversation:error", (error) => {
      console.error("Conversation error:", error);
    });

    // ========================================
    // NEW MESSAGE
    // ========================================

    socket.on("message:new", (message: Message) => {
      console.log("REALTIME MESSAGE RECEIVED:", message);

      // ========================================
      // NORMALIZE IDS
      // ========================================

      const messageConversationId = String(message.conversationId);

      const selectedConversationId = conversationId
        ? String(conversationId)
        : null;

      const messageSenderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id;

      const normalizedSenderId = messageSenderId
        ? String(messageSenderId)
        : null;

      const normalizedCurrentUserId = String(currentUserId);

      const isOwnMessage = normalizedSenderId === normalizedCurrentUserId;

      const isCurrentConversation =
        messageConversationId === selectedConversationId;

      // ========================================
      // DELIVERY
      // ========================================

      if (normalizedSenderId && !isOwnMessage) {
        socket.emit("message:delivered", {
          messageId: message._id,
        });

        console.log("Message delivered:", message._id);
      }

      // ========================================
      // MESSAGE CACHE
      // ========================================
      //
      // IMPORTANT:
      //
      // Don't check isCurrentConversation here.
      //
      // Even if another chat is open, we need to
      // keep this conversation's cached messages
      // up to date.
      // ========================================

      dispatch(
        messageApi.util.updateQueryData(
          "getMessages",
          {
            conversationId: messageConversationId,

            page: 1,

            limit: 30,
          },
          (draft) => {
            const exists = draft.messages.some(
              (existingMessage) =>
                String(existingMessage._id) === String(message._id),
            );

            if (exists) {
              return;
            }

            draft.messages.push(message);

            // Keep chronological order

            draft.messages.sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            );
          },
        ),
      );

      // ========================================
      // SIDEBAR CACHE
      // ========================================

      dispatch(
        conversationApi.util.updateQueryData(
          "getConversations",
          undefined,
          (draft) => {
            const conversation = draft.find(
              (item) => String(item._id) === messageConversationId,
            );

            if (!conversation) {
              return;
            }

            // ----------------------------------
            // Last message
            // ----------------------------------

            conversation.lastMessage =
              message as typeof conversation.lastMessage;

            // ----------------------------------
            // Updated time
            // ----------------------------------

            conversation.updatedAt = message.updatedAt || message.createdAt;

            // ----------------------------------
            // Unread
            // ----------------------------------

            if (!isOwnMessage && !isCurrentConversation) {
              conversation.unreadCount = (conversation.unreadCount || 0) + 1;
            }

            // ----------------------------------
            // Move conversation to top
            // ----------------------------------

            const currentIndex = draft.findIndex(
              (item) => String(item._id) === messageConversationId,
            );

            if (currentIndex > 0) {
              const [updatedConversation] = draft.splice(currentIndex, 1);

              if (updatedConversation) {
                draft.unshift(updatedConversation);
              }
            }
          },
        ),
      );
    });

    // ========================================
    // MESSAGE DELIVERY UPDATE
    // ========================================

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
        console.log("MESSAGE DELIVERY UPDATE:", {
          messageId,
          conversationId: deliveryConversationId,
          userId,
        });

        // ====================================
        // UPDATE MESSAGE CACHE
        // ====================================
        //
        // Don't check selected conversation.
        //
        // Delivery can happen while another
        // conversation is open.
        // ====================================

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

              if (!message) {
                return;
              }

              // --------------------------------
              // Initialize deliveredTo
              // --------------------------------

              if (!message.deliveredTo) {
                message.deliveredTo = [];
              }

              // --------------------------------
              // Prevent duplicate
              // --------------------------------

              const alreadyDelivered = message.deliveredTo.some(
                (id) => String(id) === String(userId),
              );

              if (alreadyDelivered) {
                return;
              }

              // --------------------------------
              // Add delivered user
              // --------------------------------

              message.deliveredTo.push(userId);
            },
          ),
        );
      },
    );

    // ========================================
    // MESSAGE READ UPDATE
    // ========================================

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
        console.log("MESSAGE READ UPDATE:", {
          messageId,
          conversationId: readConversationId,
          userId,
        });

        // ====================================
        // UPDATE MESSAGE CACHE
        // ====================================

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

              if (!message) {
                return;
              }

              // --------------------------------
              // Initialize readBy
              // --------------------------------

              if (!message.readBy) {
                message.readBy = [];
              }

              // --------------------------------
              // Prevent duplicate
              // --------------------------------

              const alreadyRead = message.readBy.some(
                (id) => String(id) === String(userId),
              );

              if (alreadyRead) {
                return;
              }

              // --------------------------------
              // Add read user
              // --------------------------------

              message.readBy.push(userId);
            },
          ),
        );
      },
    );

    // ========================================
    // TYPING START
    // ========================================

    socket.on(
      "typing:start",
      ({
        conversationId: typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        // Only selected conversation
        // should show typing indicator.

        if (String(typingConversationId) !== String(conversationId)) {
          return;
        }

        // Ignore own typing

        if (String(userId) === String(currentUserId)) {
          return;
        }

        console.log("USER STARTED TYPING:", userId);

        onTypingStart?.(userId);
      },
    );

    // ========================================
    // TYPING STOP
    // ========================================

    socket.on(
      "typing:stop",
      ({
        conversationId: typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        // Only selected conversation
        // should show typing indicator.

        if (String(typingConversationId) !== String(conversationId)) {
          return;
        }

        // Ignore own typing

        if (String(userId) === String(currentUserId)) {
          return;
        }

        console.log("USER STOPPED TYPING:", userId);

        onTypingStop?.(userId);
      },
    );

    // ========================================
    // CONNECT ERROR
    // ========================================

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    // ========================================
    // DISCONNECT
    // ========================================

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      // --------------------------------------
      // Leave selected conversation
      // --------------------------------------

      if (joinedConversationRef.current) {
        socket.emit("conversation:leave", {
          conversationId: joinedConversationRef.current,
        });
      }

      // --------------------------------------
      // Remove listeners
      // --------------------------------------

      socket.removeAllListeners();

      // --------------------------------------
      // Disconnect socket
      // --------------------------------------

      socket.disconnect();

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

  // ==========================================
  // SEND TYPING START
  // ==========================================

  const sendTypingStart = () => {
    const socket = socketRef.current;

    if (!socket || !conversationId) {
      return;
    }

    socket.emit("typing:start", {
      conversationId,
    });
  };

  // ==========================================
  // SEND TYPING STOP
  // ==========================================

  const sendTypingStop = () => {
    const socket = socketRef.current;

    if (!socket || !conversationId) {
      return;
    }

    socket.emit("typing:stop", {
      conversationId,
    });
  };

  // ==========================================
  // RETURN
  // ==========================================

  return {
    socket: socketRef.current,

    sendTypingStart,

    sendTypingStop,
  };
}
