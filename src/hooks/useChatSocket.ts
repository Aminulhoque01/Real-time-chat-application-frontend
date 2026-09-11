"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import { io, Socket } from "socket.io-client";

import {
  useAppDispatch,
  useAppSelector,
} from "@/src/redux/hooks";

import { messageApi } from "@/src/redux/features/message/messageApi";
import { conversationApi } from "@/src/redux/features/conversation/conversationApi";

import type { Message } from "@/src/redux/features/message/message.types";

interface ChatSocketProps {
  conversationId: string | null;

  onTypingStart?: (
    userId: string,
  ) => void;

  onTypingStop?: (
    userId: string,
  ) => void;
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

  const token = useAppSelector(
    (state) => state.auth.token,
  );

  const currentUserId = useAppSelector(
    (state) => state.auth.user?._id,
  );

  // ==========================================
  // SOCKET
  // ==========================================

  const socketRef =
    useRef<Socket | null>(null);

  const joinedConversationRef =
    useRef<string | null>(null);

  // ==========================================
  // CURRENT VALUES REFS
  // ==========================================

  /*
    Socket event listeners stay alive even when
    conversation changes.

    So we keep the latest values in refs.
  */

  const conversationIdRef =
    useRef<string | null>(
      conversationId,
    );

  const currentUserIdRef =
    useRef<string | undefined>(
      currentUserId,
    );

  const onTypingStartRef =
    useRef<
      ((userId: string) => void) | undefined
    >(onTypingStart);

  const onTypingStopRef =
    useRef<
      ((userId: string) => void) | undefined
    >(onTypingStop);

  useEffect(() => {
    conversationIdRef.current =
      conversationId;
  }, [conversationId]);

  useEffect(() => {
    currentUserIdRef.current =
      currentUserId;
  }, [currentUserId]);

  useEffect(() => {
    onTypingStartRef.current =
      onTypingStart;
  }, [onTypingStart]);

  useEffect(() => {
    onTypingStopRef.current =
      onTypingStop;
  }, [onTypingStop]);

  // ==========================================
  // PENDING READ MESSAGE IDS
  // ==========================================

  /*
    If a message needs to be marked as read
    while socket is not connected, keep its ID here.

    Once socket connects, all pending messages
    will automatically be marked as read.
  */

  const pendingReadMessageIds =
    useRef<Set<string>>(new Set());

  // ==========================================
  // MARK MESSAGE AS READ
  // ==========================================

  const markMessageAsRead =
    useCallback((messageId: string) => {
      if (!messageId) {
        return;
      }

      const socket =
        socketRef.current;

      /*
        Socket does not exist yet.
        Queue the message.
      */

      if (!socket) {
        pendingReadMessageIds.current.add(
          String(messageId),
        );

        console.log(
          "READ QUEUED - socket unavailable:",
          messageId,
        );

        return;
      }

      /*
        Socket exists but is not connected.
        Queue the message.
      */

      if (!socket.connected) {
        pendingReadMessageIds.current.add(
          String(messageId),
        );

        console.log(
          "READ QUEUED - socket not connected:",
          messageId,
        );

        return;
      }

      /*
        Socket is connected.
        Send immediately.
      */

      socket.emit("message:read", {
        messageId,
      });

      console.log(
        "MESSAGE READ EMITTED:",
        messageId,
      );
    }, []);

  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    if (!token || !currentUserId) {
      return;
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      "http://localhost:5000";

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
      console.log(
        "Socket connected:",
        socket.id,
      );

      // ======================================
      // JOIN CURRENT CONVERSATION
      // ======================================

      const selectedConversationId =
        conversationIdRef.current;

      if (selectedConversationId) {
        socket.emit(
          "conversation:join",
          {
            conversationId:
              selectedConversationId,
          },
        );

        joinedConversationRef.current =
          selectedConversationId;

        console.log(
          "Joining conversation:",
          selectedConversationId,
        );
      }

      // ======================================
      // FLUSH PENDING READS
      // ======================================

      if (
        pendingReadMessageIds.current
          .size > 0
      ) {
        console.log(
          "Flushing pending read messages:",
          Array.from(
            pendingReadMessageIds.current,
          ),
        );

        pendingReadMessageIds.current.forEach(
          (messageId) => {
            socket.emit(
              "message:read",
              {
                messageId,
              },
            );

            console.log(
              "Pending message marked as read:",
              messageId,
            );
          },
        );

        pendingReadMessageIds.current.clear();
      }
    });

    // ========================================
    // CONVERSATION JOINED
    // ========================================

    socket.on(
      "conversation:joined",
      ({
        conversationId:
          joinedConversationId,
      }) => {
        console.log(
          "Conversation joined:",
          joinedConversationId,
        );
      },
    );

    // ========================================
    // CONVERSATION ERROR
    // ========================================

    socket.on(
      "conversation:error",
      (error) => {
        console.error(
          "Conversation error:",
          error,
        );
      },
    );

    // ========================================
    // NEW MESSAGE
    // ========================================

    socket.on(
      "message:new",
      (message: Message) => {
        console.log(
          "REALTIME MESSAGE RECEIVED:",
          message,
        );

        // ====================================
        // NORMALIZE IDS
        // ====================================

        const messageConversationId =
          String(
            message.conversationId,
          );

        const selectedConversationId =
          conversationIdRef.current
            ? String(
                conversationIdRef.current,
              )
            : null;

        const messageSenderId =
          typeof message.senderId ===
          "string"
            ? message.senderId
            : message.senderId?._id;

        const normalizedSenderId =
          messageSenderId
            ? String(messageSenderId)
            : null;

        const normalizedCurrentUserId =
          currentUserIdRef.current
            ? String(
                currentUserIdRef.current,
              )
            : null;

        const isOwnMessage =
          normalizedSenderId ===
          normalizedCurrentUserId;

        const isCurrentConversation =
          messageConversationId ===
          selectedConversationId;

        // ====================================
        // DELIVERY
        // ====================================

        if (
          normalizedSenderId &&
          !isOwnMessage
        ) {
          socket.emit(
            "message:delivered",
            {
              messageId:
                message._id,
            },
          );

          console.log(
            "Message delivered:",
            message._id,
          );
        }

        // ====================================
        // READ / SEEN
        // ====================================

        /*
          If receiver is currently inside
          this conversation, immediately
          mark the message as read.
        */

        if (
          normalizedSenderId &&
          !isOwnMessage &&
          isCurrentConversation
        ) {
          markMessageAsRead(
            message._id,
          );

          console.log(
            "Message read:",
            message._id,
          );
        }

        // ====================================
        // MESSAGE CACHE
        // ====================================

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId:
                messageConversationId,
              page: 1,
              limit: 30,
            },
            (draft) => {
              const exists =
                draft.messages.some(
                  (existingMessage) =>
                    String(
                      existingMessage._id,
                    ) ===
                    String(message._id),
                );

              if (exists) {
                return;
              }

              draft.messages.push(
                message,
              );

              // Keep chronological order
              draft.messages.sort(
                (a, b) =>
                  new Date(
                    a.createdAt,
                  ).getTime() -
                  new Date(
                    b.createdAt,
                  ).getTime(),
              );
            },
          ),
        );

        // ====================================
        // SIDEBAR CACHE
        // ====================================

        dispatch(
          conversationApi.util.updateQueryData(
            "getConversations",
            undefined,
            (draft) => {
              const conversation =
                draft.find(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    messageConversationId,
                );

              if (!conversation) {
                return;
              }

              // --------------------------------
              // Last message
              // --------------------------------

              conversation.lastMessage =
                message as typeof conversation.lastMessage;

              // --------------------------------
              // Updated time
              // --------------------------------

              conversation.updatedAt =
                message.updatedAt ||
                message.createdAt;

              // --------------------------------
              // Unread
              // --------------------------------

              if (
                !isOwnMessage &&
                !isCurrentConversation
              ) {
                conversation.unreadCount =
                  (conversation.unreadCount ||
                    0) + 1;
              }

              // --------------------------------
              // Move conversation to top
              // --------------------------------

              const currentIndex =
                draft.findIndex(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    messageConversationId,
                );

              if (currentIndex > 0) {
                const [
                  updatedConversation,
                ] = draft.splice(
                  currentIndex,
                  1,
                );

                if (
                  updatedConversation
                ) {
                  draft.unshift(
                    updatedConversation,
                  );
                }
              }
            },
          ),
        );
      },
    );

    // ========================================
    // MESSAGE DELIVERY UPDATE
    // ========================================

    socket.on(
      "message:delivery:update",
      ({
        messageId,
        conversationId:
          deliveryConversationId,
        userId,
      }: {
        messageId: string;
        conversationId: string;
        userId: string;
      }) => {
        console.log(
          "MESSAGE DELIVERY UPDATE:",
          {
            messageId,
            conversationId:
              deliveryConversationId,
            userId,
          },
        );

        // ====================================
        // UPDATE MESSAGE CACHE
        // ====================================

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId: String(
                deliveryConversationId,
              ),
              page: 1,
              limit: 30,
            },
            (draft) => {
              const message =
                draft.messages.find(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    String(messageId),
                );

              if (!message) {
                console.log(
                  "DELIVERY UPDATE: Message not found in cache",
                  messageId,
                );

                return;
              }

              // --------------------------------
              // Initialize deliveredTo
              // --------------------------------

              if (
                !message.deliveredTo
              ) {
                message.deliveredTo =
                  [];
              }

              // --------------------------------
              // Prevent duplicate
              // --------------------------------

              const alreadyDelivered =
                message.deliveredTo.some(
                  (id) =>
                    String(id) ===
                    String(userId),
                );

              if (
                alreadyDelivered
              ) {
                return;
              }

              // --------------------------------
              // Add delivered user
              // --------------------------------

              message.deliveredTo.push(
                userId,
              );

              console.log(
                "DELIVERY UPDATE: deliveredTo updated",
                {
                  messageId,
                  userId,
                  deliveredTo:
                    message.deliveredTo,
                },
              );
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
        conversationId:
          readConversationId,
        userId,
      }: {
        messageId: string;
        conversationId: string;
        userId: string;
      }) => {
        console.log(
          "MESSAGE READ UPDATE:",
          {
            messageId,
            conversationId:
              readConversationId,
            userId,
          },
        );

        // ====================================
        // UPDATE MESSAGE CACHE
        // ====================================

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId: String(
                readConversationId,
              ),
              page: 1,
              limit: 30,
            },
            (draft) => {
              const message =
                draft.messages.find(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    String(messageId),
                );

              if (!message) {
                console.log(
                  "READ UPDATE: Message not found in cache",
                  messageId,
                );

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

              const alreadyRead =
                message.readBy.some(
                  (id) =>
                    String(id) ===
                    String(userId),
                );

              if (alreadyRead) {
                console.log(
                  "READ UPDATE: Already marked as read",
                  messageId,
                );

                return;
              }

              // --------------------------------
              // Add reader
              // --------------------------------

              message.readBy.push(
                userId,
              );

              console.log(
                "READ UPDATE: readBy updated",
                {
                  messageId,
                  userId,
                  readBy:
                    message.readBy,
                },
              );
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
        conversationId:
          typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        // Only selected conversation
        // should show typing indicator.

        if (
          String(
            typingConversationId,
          ) !==
          String(
            conversationIdRef.current,
          )
        ) {
          return;
        }

        // Ignore own typing

        if (
          String(userId) ===
          String(
            currentUserIdRef.current,
          )
        ) {
          return;
        }

        console.log(
          "USER STARTED TYPING:",
          userId,
        );

        onTypingStartRef.current?.(
          userId,
        );
      },
    );

    // ========================================
    // TYPING STOP
    // ========================================

    socket.on(
      "typing:stop",
      ({
        conversationId:
          typingConversationId,
        userId,
      }: {
        conversationId: string;
        userId: string;
      }) => {
        // Only selected conversation
        // should show typing indicator.

        if (
          String(
            typingConversationId,
          ) !==
          String(
            conversationIdRef.current,
          )
        ) {
          return;
        }

        // Ignore own typing

        if (
          String(userId) ===
          String(
            currentUserIdRef.current,
          )
        ) {
          return;
        }

        console.log(
          "USER STOPPED TYPING:",
          userId,
        );

        onTypingStopRef.current?.(
          userId,
        );
      },
    );

    // ========================================
    // CONNECT ERROR
    // ========================================

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message,
        );
      },
    );

    // ========================================
    // DISCONNECT
    // ========================================

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "Socket disconnected:",
          reason,
        );
      },
    );

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      // --------------------------------------
      // Leave selected conversation
      // --------------------------------------

      if (
        joinedConversationRef.current
      ) {
        socket.emit(
          "conversation:leave",
          {
            conversationId:
              joinedConversationRef.current,
          },
        );
      }

      // --------------------------------------
      // Remove listeners
      // --------------------------------------

      socket.removeAllListeners();

      // --------------------------------------
      // Disconnect socket
      // --------------------------------------

      socket.disconnect();

      // --------------------------------------
      // Clear socket reference
      // --------------------------------------

      if (
        socketRef.current === socket
      ) {
        socketRef.current = null;
      }

      joinedConversationRef.current =
        null;
    };
  }, [
    token,
    currentUserId,
    dispatch,
    markMessageAsRead,
  ]);

  // ==========================================
  // CHANGE CONVERSATION
  // ==========================================

  useEffect(() => {
    const socket =
      socketRef.current;

    if (!socket) {
      /*
        Socket may still be connecting.

        The connect handler will automatically
        join conversationIdRef.current.
      */

      return;
    }

    /*
      If socket isn't connected yet,
      don't emit join/leave.

      The connect handler will use the
      latest conversation ID.
    */

    if (!socket.connected) {
      return;
    }

    const nextConversationId =
      conversationId;

    const previousConversationId =
      joinedConversationRef.current;

    /*
      Nothing changed.
    */

    if (
      previousConversationId ===
      nextConversationId
    ) {
      return;
    }

    // ========================================
    // LEAVE OLD CONVERSATION
    // ========================================

    if (previousConversationId) {
      socket.emit(
        "conversation:leave",
        {
          conversationId:
            previousConversationId,
        },
      );

      console.log(
        "Leaving conversation:",
        previousConversationId,
      );
    }

    joinedConversationRef.current =
      null;

    // ========================================
    // JOIN NEW CONVERSATION
    // ========================================

    if (nextConversationId) {
      socket.emit(
        "conversation:join",
        {
          conversationId:
            nextConversationId,
        },
      );

      joinedConversationRef.current =
        nextConversationId;

      console.log(
        "Joining conversation:",
        nextConversationId,
      );
    }
  }, [conversationId]);

  // ==========================================
  // SEND TYPING START
  // ==========================================

  const sendTypingStart =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        !conversationId
      ) {
        return;
      }

      if (!socket.connected) {
        return;
      }

      socket.emit("typing:start", {
        conversationId,
      });
    }, [conversationId]);

  // ==========================================
  // SEND TYPING STOP
  // ==========================================

  const sendTypingStop =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        !conversationId
      ) {
        return;
      }

      if (!socket.connected) {
        return;
      }

      socket.emit("typing:stop", {
        conversationId,
      });
    }, [conversationId]);

  // ==========================================
  // RETURN
  // ==========================================

  return {
    socket: socketRef.current,

    sendTypingStart,

    sendTypingStop,

    markMessageAsRead,
  };
}