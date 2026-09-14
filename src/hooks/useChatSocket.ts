"use client";

import {
  useCallback,
  useEffect,
  useRef,
} from "react";

import {
  io,
  Socket,
} from "socket.io-client";

import {
  useAppDispatch,
  useAppSelector,
} from "@/src/redux/hooks";

import { messageApi } from "@/src/redux/features/message/messageApi";

import { conversationApi } from "@/src/redux/features/conversation/conversationApi";

import type { Message } from "@/src/redux/features/message/message.types";

// ==========================================
// TYPES
// ==========================================

interface ChatSocketProps {
  conversationId: string | null;

  onTypingStart?: (userId: string) => void;

  onTypingStop?: (userId: string) => void;
}

// ==========================================
// REACTION TYPES
// ==========================================

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
  messageId: string;

  conversationId: string;

  action: "added" | "removed";

  reactionSummary: ReactionSummary[];
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

  const pendingReadMessageIds =
    useRef<Set<string>>(new Set());

  // ==========================================
  // MARK MESSAGE AS READ
  // ==========================================

  const markMessageAsRead =
    useCallback(
      (messageId: string) => {
        if (!messageId) {
          return;
        }

        const normalizedMessageId =
          String(messageId);

        const socket =
          socketRef.current;

        if (!socket) {
          pendingReadMessageIds.current.add(
            normalizedMessageId,
          );

          console.log(
            "READ QUEUED - socket unavailable:",
            normalizedMessageId,
          );

          return;
        }

        if (!socket.connected) {
          pendingReadMessageIds.current.add(
            normalizedMessageId,
          );

          console.log(
            "READ QUEUED - socket not connected:",
            normalizedMessageId,
          );

          return;
        }

        socket.emit(
          "message:read",
          {
            messageId:
              normalizedMessageId,
          },
        );

        console.log(
          "MESSAGE READ EMITTED:",
          normalizedMessageId,
        );
      },
      [],
    );

  // ==========================================
  // SOCKET CONNECTION
  // ==========================================

  useEffect(() => {
    if (
      !token ||
      !currentUserId
    ) {
      return;
    }

    const socketUrl =
      process.env
        .NEXT_PUBLIC_SOCKET_URL ||
      "http://localhost:5000";

    // ========================================
    // CREATE SOCKET
    // ========================================

    const socket = io(
      socketUrl,
      {
        auth: {
          token,
        },

        withCredentials: true,

        reconnection: true,

        reconnectionAttempts:
          Infinity,

        reconnectionDelay:
          1000,

        reconnectionDelayMax:
          5000,

        randomizationFactor:
          0.5,
      },
    );

    socketRef.current =
      socket;

    // ========================================
    // CONNECT
    // ========================================

    socket.on(
      "connect",
      () => {
        console.log(
          "Socket connected:",
          socket.id,
        );

        console.log(
          "Socket transport:",
          socket.io.engine
            .transport.name,
        );

        // ======================================
        // REJOIN CURRENT CONVERSATION
        // ======================================

        const selectedConversationId =
          conversationIdRef.current;

        if (
          selectedConversationId
        ) {
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
          pendingReadMessageIds
            .current.size > 0
        ) {
          const pendingIds =
            Array.from(
              pendingReadMessageIds
                .current,
            );

          console.log(
            "Flushing pending read messages:",
            pendingIds,
          );

          pendingIds.forEach(
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
      },
    );

    // ========================================
    // RECONNECT ATTEMPT
    // ========================================

    socket.io.on(
      "reconnect_attempt",
      (attempt) => {
        console.log(
          "Socket reconnect attempt:",
          attempt,
        );
      },
    );

    // ========================================
    // RECONNECT ERROR
    // ========================================

    socket.io.on(
      "reconnect_error",
      (error) => {
        console.error(
          "Socket reconnect error:",
          error.message,
        );
      },
    );

    // ========================================
    // RECONNECT SUCCESS
    // ========================================

    socket.io.on(
      "reconnect",
      (attempt) => {
        console.log(
          "Socket reconnected successfully:",
          {
            socketId:
              socket.id,
            attempt,
          },
        );
      },
    );

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
            ? String(
                messageSenderId,
              )
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
                  (
                    existingMessage,
                  ) =>
                    String(
                      existingMessage._id,
                    ) ===
                    String(
                      message._id,
                    ),
                );

              if (exists) {
                return;
              }

              draft.messages.push(
                message,
              );

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

              conversation.lastMessage =
                message as typeof conversation.lastMessage;

              conversation.updatedAt =
                message.updatedAt ||
                message.createdAt;

              if (
                !isOwnMessage &&
                !isCurrentConversation
              ) {
                conversation.unreadCount =
                  (conversation.unreadCount ||
                    0) + 1;
              }

              const currentIndex =
                draft.findIndex(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    messageConversationId,
                );

              if (
                currentIndex > 0
              ) {
                const [
                  updatedConversation,
                ] =
                  draft.splice(
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

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId:
                String(
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
                    String(
                      messageId,
                    ),
                );

              if (!message) {
                console.log(
                  "DELIVERY UPDATE: Message not found in cache",
                  messageId,
                );

                return;
              }

              if (
                !message.deliveredTo
              ) {
                message.deliveredTo =
                  [];
              }

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

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId:
                String(
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
                    String(
                      messageId,
                    ),
                );

              if (!message) {
                console.log(
                  "READ UPDATE: Message not found in cache",
                  messageId,
                );

                return;
              }

              if (
                !message.readBy
              ) {
                message.readBy =
                  [];
              }

              const alreadyRead =
                message.readBy.some(
                  (id) =>
                    String(id) ===
                    String(userId),
                );

              if (
                alreadyRead
              ) {
                console.log(
                  "READ UPDATE: Already marked as read",
                  messageId,
                );

                return;
              }

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
    // MESSAGE EDITED UPDATE
    // ========================================

    socket.on(
      "message:edited",
      (message: Message) => {
        console.log(
          "MESSAGE EDITED UPDATE:",
          message,
        );

        const messageConversationId =
          String(
            message.conversationId,
          );

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
              const existingMessage =
                draft.messages.find(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    String(
                      message._id,
                    ),
                );

              if (!existingMessage) {
                console.log(
                  "EDIT UPDATE: Message not found in cache",
                  message._id,
                );

                return;
              }

              existingMessage.text =
                message.text;

              existingMessage.isEdited =
                message.isEdited;

              existingMessage.updatedAt =
                message.updatedAt;

              console.log(
                "EDIT UPDATE: Message updated",
                message._id,
              );
            },
          ),
        );
      },
    );

    // ========================================
    // MESSAGE DELETED UPDATE
    // ========================================

    socket.on(
      "message:deleted",
      ({
        messageId,
        conversationId:
          deletedConversationId,
        isDeleted,
        deletedAt,
      }: {
        messageId: string;
        conversationId: string;
        isDeleted: boolean;
        deletedAt?: string | null;
      }) => {
        console.log(
          "MESSAGE DELETED UPDATE:",
          {
            messageId,
            conversationId:
              deletedConversationId,
            isDeleted,
            deletedAt,
          },
        );

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId:
                String(
                  deletedConversationId,
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
                    String(
                      messageId,
                    ),
                );

              if (!message) {
                console.log(
                  "DELETE UPDATE: Message not found in cache",
                  messageId,
                );

                return;
              }

              message.isDeleted =
                isDeleted;

              message.deletedAt =
                deletedAt ?? null;

              message.text = "";

              message.attachments =
                [];

              message.reactions =
                [];

              console.log(
                "DELETE UPDATE: Message marked as deleted",
                messageId,
              );
            },
          ),
        );
      },
    );

    // ========================================
    // MESSAGE REACTION UPDATE
    // ========================================

    socket.on(
      "message:reaction:update",
      (
        reactionUpdate:
          MessageReactionUpdate,
      ) => {
        console.log(
          "MESSAGE REACTION UPDATE:",
          reactionUpdate,
        );

        const {
          messageId,
          conversationId:
            reactionConversationId,
          action,
          reactionSummary,
        } = reactionUpdate;

        if (
          !messageId ||
          !reactionConversationId
        ) {
          console.error(
            "REACTION UPDATE: Invalid reaction payload",
            reactionUpdate,
          );

          return;
        }

        // ====================================
        // UPDATE MESSAGE CACHE
        // ====================================

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId:
                String(
                  reactionConversationId,
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
                    String(
                      messageId,
                    ),
                );

              if (!message) {
                console.log(
                  "REACTION UPDATE: Message not found in cache",
                  messageId,
                );

                return;
              }

              // =================================
              // SAVE REACTION SUMMARY
              // =================================

              message.reactions =
                reactionSummary;

              console.log(
                "REACTION UPDATE: Reactions updated",
                {
                  messageId,
                  action,
                  reactionSummary,
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

        joinedConversationRef.current =
          null;

        console.log(
          "Current conversation preserved for reconnect:",
          conversationIdRef.current,
        );

        console.log(
          "Will reconnect:",
          reason !==
            "io client disconnect",
        );
      },
    );

    // ========================================
    // CLEANUP
    // ========================================

    return () => {
      console.log(
        "Cleaning up socket:",
        socket.id,
      );

      if (
        joinedConversationRef.current &&
        socket.connected
      ) {
        socket.emit(
          "conversation:leave",
          {
            conversationId:
              joinedConversationRef.current,
          },
        );

        console.log(
          "Leaving conversation:",
          joinedConversationRef.current,
        );
      }

      socket.removeAllListeners();

      socket.io.removeAllListeners();

      socket.disconnect();

      if (
        socketRef.current ===
        socket
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
      return;
    }

    if (!socket.connected) {
      return;
    }

    const nextConversationId =
      conversationId;

    const previousConversationId =
      joinedConversationRef.current;

    // ========================================
    // NOTHING CHANGED
    // ========================================

    if (
      previousConversationId ===
      nextConversationId
    ) {
      return;
    }

    // ========================================
    // LEAVE OLD CONVERSATION
    // ========================================

    if (
      previousConversationId
    ) {
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

    if (
      nextConversationId
    ) {
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

      socket.emit(
        "typing:start",
        {
          conversationId,
        },
      );
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

      socket.emit(
        "typing:stop",
        {
          conversationId,
        },
      );
    }, [conversationId]);

  // ==========================================
  // DELETE MESSAGE REALTIME
  // ==========================================

  const deleteMessageRealtime =
    useCallback(
      (messageId: string) => {
        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          console.error(
            "Socket is not connected. Cannot delete message.",
          );

          return false;
        }

        socket.emit(
          "message:delete",
          {
            messageId,
          },
        );

        return true;
      },
      [],
    );

  // ==========================================
  // EDIT MESSAGE REALTIME
  // ==========================================

  const editMessageRealtime =
    useCallback(
      (
        messageId: string,
        text: string,
      ) => {
        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          console.error(
            "Socket is not connected. Cannot edit message.",
          );

          return false;
        }

        const trimmedText =
          text.trim();

        if (!trimmedText) {
          console.error(
            "Cannot edit message with empty text.",
          );

          return false;
        }

        socket.emit(
          "message:edit",
          {
            messageId,
            text: trimmedText,
          },
        );

        console.log(
          "MESSAGE EDIT EMITTED:",
          {
            messageId,
            text: trimmedText,
          },
        );

        return true;
      },
      [],
    );

  // ==========================================
  // TOGGLE MESSAGE REACTION REALTIME
  // ==========================================

  const toggleMessageReactionRealtime =
    useCallback(
      (
        messageId: string,
        emoji: string,
      ) => {
        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          console.error(
            "Socket is not connected. Cannot react to message.",
          );

          return false;
        }

        if (!messageId) {
          console.error(
            "Message ID is required for reaction.",
          );

          return false;
        }

        if (!emoji) {
          console.error(
            "Emoji is required for reaction.",
          );

          return false;
        }

        // ====================================
        // SEND TO BACKEND
        // ====================================

        socket.emit(
          "message:reaction",
          {
            messageId,
            emoji,
          },
        );

        console.log(
          "MESSAGE REACTION EMITTED:",
          {
            messageId,
            emoji,
          },
        );

        return true;
      },
      [],
    );

  // ==========================================
  // RETURN
  // ==========================================

  return {
    socket:
      socketRef.current,

    sendTypingStart,

    sendTypingStop,

    markMessageAsRead,

    deleteMessageRealtime,

    editMessageRealtime,

    toggleMessageReactionRealtime,
  };
}