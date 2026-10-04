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

import {
  conversationApi,
} from "@/src/redux/features/conversation/conversationApi";

import type {
  Message,
} from "@/src/redux/features/message/message.types";

import {
  emitChatNotification,
} from "../lib/chat-notification";

// ======================================================
// TYPES
// ======================================================

interface ChatSocketProps {
  conversationId: string | null;

  onTypingStart?: (
    userId: string,
  ) => void;

  onTypingStop?: (
    userId: string,
  ) => void;

  onUserBlocked?: (data: {
    blockerId: string;
    blockedId: string;
  }) => void;

  onUserUnblocked?: (data: {
    blockerId: string;
    blockedId: string;
  }) => void;
}

// ======================================================
// POPULATED SENDER
// ======================================================

interface PopulatedSender {
  _id:
    | string
    | {
        toString(): string;
      };

  phone?: string;

  name?: string;

  avatar?: string | null;

  avatarUrl?: string | null;

  bio?: string | null;

  isOnline?: boolean;

  lastSeen?:
    | string
    | Date
    | null;
}

// ======================================================
// REACTION TYPES
// ======================================================

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

  action:
    | "added"
    | "removed";

  reactionSummary:
    ReactionSummary[];
}

// ======================================================
// BLOCK TYPES
// ======================================================

interface UserBlockedEvent {
  blockerId: string;
  blockedId: string;
}

interface UserUnblockedEvent {
  blockerId: string;
  blockedId: string;
}

// ======================================================
// CONVERSATION ERROR
// ======================================================

interface ConversationError {
  message?: string;

  conversationId?: string;

  [key: string]: unknown;
}

// ======================================================
// CONVERSATION READ UPDATE
// ======================================================

interface ConversationReadUpdate {
  conversationId: string;

  userId: string;

  messageIds: string[];
}

// ======================================================
// HELPER
// ======================================================

const normalizeId = (
  value: unknown,
): string | null => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "_id" in value
  ) {
    const id = (
      value as {
        _id?: unknown;
      }
    )._id;

    if (
      id !== null &&
      id !== undefined &&
      id !== ""
    ) {
      return String(id);
    }
  }

  return String(value);
};

// ======================================================
// GET POPULATED SENDER
// ======================================================

const getPopulatedSender = (
  message: Message,
): PopulatedSender | null => {
  if (
    !message.senderId ||
    typeof message.senderId !==
      "object"
  ) {
    return null;
  }

  return message.senderId as unknown as PopulatedSender;
};

// ======================================================
// NOTIFICATION BODY
// ======================================================

const getNotificationBody = (
  message: Message,
): string => {
  if (
    message.text &&
    message.text.trim()
  ) {
    return message.text.trim();
  }

  if (
    message.attachments &&
    message.attachments.length > 0
  ) {
    const attachment =
      message.attachments[0];

    switch (
      attachment.type
    ) {
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
  const dispatch =
    useAppDispatch();

  // ====================================================
  // AUTH
  // ====================================================

  const token =
    useAppSelector(
      (state) =>
        state.auth.token,
    );

  const currentUserId =
    useAppSelector(
      (state) =>
        state.auth.user?._id,
    );

  // ====================================================
  // SOCKET
  // ====================================================

  const socketRef =
    useRef<Socket | null>(
      null,
    );

  // ====================================================
  // JOINED CONVERSATION
  // ====================================================

  const joinedConversationRef =
    useRef<string | null>(
      null,
    );

  // ====================================================
  // CURRENT CONVERSATION
  // ====================================================

  const conversationIdRef =
    useRef<string | null>(
      conversationId
        ? String(conversationId)
        : null,
    );

  // ====================================================
  // CURRENT USER
  // ====================================================

  const currentUserIdRef =
    useRef<string | undefined>(
      currentUserId
        ? String(currentUserId)
        : undefined,
    );

  // ====================================================
  // CALLBACK REFS
  // ====================================================

  const onTypingStartRef =
    useRef<
      | ((userId: string) => void)
      | undefined
    >(onTypingStart);

  const onTypingStopRef =
    useRef<
      | ((userId: string) => void)
      | undefined
    >(onTypingStop);

  const onUserBlockedRef =
    useRef<
      | ((data: UserBlockedEvent) => void)
      | undefined
    >(onUserBlocked);

  const onUserUnblockedRef =
    useRef<
      | ((data: UserUnblockedEvent) => void)
      | undefined
    >(onUserUnblocked);

  // ====================================================
  // UPDATE CONVERSATION REF
  // ====================================================

  useEffect(() => {
    conversationIdRef.current =
      conversationId
        ? String(conversationId)
        : null;
  }, [conversationId]);

  // ====================================================
  // UPDATE USER REF
  // ====================================================

  useEffect(() => {
    currentUserIdRef.current =
      currentUserId
        ? String(currentUserId)
        : undefined;
  }, [currentUserId]);

  // ====================================================
  // UPDATE CALLBACK REFS
  // ====================================================

  useEffect(() => {
    onTypingStartRef.current =
      onTypingStart;
  }, [onTypingStart]);

  useEffect(() => {
    onTypingStopRef.current =
      onTypingStop;
  }, [onTypingStop]);

  useEffect(() => {
    onUserBlockedRef.current =
      onUserBlocked;
  }, [onUserBlocked]);

  useEffect(() => {
    onUserUnblockedRef.current =
      onUserUnblocked;
  }, [onUserUnblocked]);

  // ====================================================
  // INCOMING AUDIO
  // ====================================================

  const incomingAudioRef =
    useRef<HTMLAudioElement | null>(
      null,
    );

  // ====================================================
  // INITIALIZE AUDIO
  // ====================================================

  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const audio =
      new Audio(
        "/notification.mp3",
      );

    audio.preload =
      "auto";

    audio.volume = 0.55;

    incomingAudioRef.current =
      audio;

    return () => {
      audio.pause();

      audio.currentTime = 0;

      incomingAudioRef.current =
        null;
    };
  }, []);

  // ====================================================
  // PLAY AUDIO
  // ====================================================

  const playIncomingMessageSound =
    useCallback(() => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      const audio =
        incomingAudioRef.current;

      if (!audio) {
        return;
      }

      try {
        audio.pause();

        audio.currentTime = 0;

        const promise =
          audio.play();

        if (promise) {
          promise.catch(
            (error) => {
              console.warn(
                "Unable to play incoming message sound:",
                error,
              );
            },
          );
        }
      } catch (error) {
        console.error(
          "Incoming message sound error:",
          error,
        );
      }
    }, []);

  // ====================================================
  // PENDING MESSAGE READ IDS
  // ====================================================

  const pendingReadMessageIds =
    useRef<Set<string>>(
      new Set(),
    );

  // ====================================================
  // MARK SINGLE MESSAGE AS READ
  // ====================================================

  const markMessageAsRead =
    useCallback(
      (messageId: string) => {
        if (!messageId) {
          return;
        }

        const normalizedId =
          String(messageId);

        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          pendingReadMessageIds.current.add(
            normalizedId,
          );

          return;
        }

        socket.emit(
          "message:read",
          {
            messageId:
              normalizedId,
          },
        );
      },
      [],
    );

  // ====================================================
  // MARK WHOLE CONVERSATION AS READ
  // ====================================================
  //
  // This is the main unread-count logic.
  //
  // When user opens a conversation:
  //
  // conversation:join
  //        ↓
  // conversation:joined
  //        ↓
  // conversation:read
  //        ↓
  // backend updates readBy
  //        ↓
  // conversation:read:update
  //        ↓
  // unreadCount = 0
  //
  // ====================================================

  const markConversationAsRead =
    useCallback(
      (id: string | null) => {
        const normalizedId =
          normalizeId(id);

        if (!normalizedId) {
          return;
        }

        // ------------------------------------------------
        // Optimistically reset sidebar count
        // ------------------------------------------------

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
                    normalizedId,
                );

              if (!conversation) {
                return;
              }

              conversation.unreadCount =
                0;
            },
          ),
        );

        // ------------------------------------------------
        // Socket
        // ------------------------------------------------

        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          return;
        }

        socket.emit(
          "conversation:read",
          {
            conversationId:
              normalizedId,
          },
        );
      },
      [dispatch],
    );

  // ====================================================
  // JOIN CONVERSATION
  // ====================================================

  const joinConversation =
    useCallback(
      (
        id: string | null,
      ) => {
        const socket =
          socketRef.current;

        if (
          !socket ||
          !socket.connected
        ) {
          return false;
        }

        const normalizedId =
          normalizeId(id);

        if (!normalizedId) {
          return false;
        }

        const alreadyJoined =
          joinedConversationRef.current;

        // ------------------------------------------------
        // Already joined
        // ------------------------------------------------

        if (
          alreadyJoined ===
          normalizedId
        ) {
          // Even if already joined,
          // make sure unread messages are
          // marked as read.
          markConversationAsRead(
            normalizedId,
          );

          return true;
        }

        // ------------------------------------------------
        // Leave old conversation
        // ------------------------------------------------

        if (
          alreadyJoined &&
          alreadyJoined !==
            normalizedId
        ) {
          socket.emit(
            "conversation:leave",
            {
              conversationId:
                alreadyJoined,
            },
          );

          console.log(
            "Leaving conversation:",
            alreadyJoined,
          );
        }

        joinedConversationRef.current =
          null;

        // ------------------------------------------------
        // Join new conversation
        // ------------------------------------------------

        socket.emit(
          "conversation:join",
          {
            conversationId:
              normalizedId,
          },
        );

        console.log(
          "Joining conversation:",
          normalizedId,
        );

        return true;
      },
      [
        markConversationAsRead,
      ],
    );

  // ====================================================
  // DISCONNECT SOCKET
  // ====================================================

  const disconnectSocket =
    useCallback(() => {
      const socket =
        socketRef.current;

      if (!socket) {
        return;
      }

      const joinedConversation =
        joinedConversationRef.current;

      if (
        joinedConversation &&
        socket.connected
      ) {
        socket.emit(
          "conversation:leave",
          {
            conversationId:
              joinedConversation,
          },
        );
      }

      socket.removeAllListeners();

      socket.io.removeAllListeners();

      socket.disconnect();

      socketRef.current =
        null;

      joinedConversationRef.current =
        null;

      pendingReadMessageIds.current.clear();
    }, []);

  // ====================================================
  // SOCKET CONNECTION
  // ====================================================

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

    // --------------------------------------------------
    // CREATE SOCKET
    // --------------------------------------------------

    const socket =
      io(
        socketUrl,
        {
          auth: {
            token,
          },

          withCredentials:
            true,

          reconnection:
            true,

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

    // ==================================================
    // CONNECT
    // ==================================================

    socket.on(
      "connect",
      () => {
        console.log(
          "Socket connected:",
          socket.id,
        );

        // ----------------------------------------------
        // JOIN CURRENT CONVERSATION
        // ----------------------------------------------

        const currentConversation =
          conversationIdRef.current;

        if (
          currentConversation
        ) {
          joinConversation(
            currentConversation,
          );
        }

        // ----------------------------------------------
        // FLUSH PENDING SINGLE MESSAGE READS
        // ----------------------------------------------

        if (
          pendingReadMessageIds
            .current.size > 0
        ) {
          const pendingIds =
            Array.from(
              pendingReadMessageIds.current,
            );

          pendingIds.forEach(
            (messageId) => {
              socket.emit(
                "message:read",
                {
                  messageId,
                },
              );
            },
          );

          pendingReadMessageIds.current.clear();
        }
      },
    );

    // ==================================================
    // RECONNECT ATTEMPT
    // ==================================================

    socket.io.on(
      "reconnect_attempt",
      (attempt) => {
        console.log(
          "Socket reconnect attempt:",
          attempt,
        );
      },
    );

    // ==================================================
    // RECONNECT
    // ==================================================

    socket.io.on(
      "reconnect",
      (attempt) => {
        console.log(
          "Socket reconnected:",
          {
            socketId:
              socket.id,

            attempt,
          },
        );

        const currentConversation =
          conversationIdRef.current;

        if (
          currentConversation
        ) {
          joinConversation(
            currentConversation,
          );
        }
      },
    );

    // ==================================================
    // RECONNECT ERROR
    // ==================================================

    socket.io.on(
      "reconnect_error",
      (error) => {
        console.error(
          "Socket reconnect error:",
          error.message,
        );
      },
    );

    // ==================================================
    // CONVERSATION JOINED
    // ==================================================
    //
    // IMPORTANT:
    // We do NOT call conversation:read immediately
    // after socket.emit("conversation:join").
    //
    // We wait for server confirmation first.
    //
    // This prevents a race condition where backend
    // receives conversation:read before the user has
    // successfully joined / passed membership validation.
    //
    // ==================================================

    socket.on(
      "conversation:joined",
      ({
        conversationId:
          joinedConversationId,
      }: {
        conversationId: string;
      }) => {
        const normalizedJoinedId =
          normalizeId(
            joinedConversationId,
          );

        if (
          !normalizedJoinedId
        ) {
          return;
        }

        console.log(
          "Conversation joined successfully:",
          normalizedJoinedId,
        );

        joinedConversationRef.current =
          normalizedJoinedId;

        // ------------------------------------------------
        // Only mark read if this is still the currently
        // selected conversation.
        // ------------------------------------------------

        const selectedConversationId =
          conversationIdRef.current;

        if (
          selectedConversationId &&
          String(
            selectedConversationId,
          ) ===
            normalizedJoinedId
        ) {
          markConversationAsRead(
            normalizedJoinedId,
          );
        }
      },
    );

    // ==================================================
    // CONVERSATION LEFT
    // ==================================================

    socket.on(
      "conversation:left",
      ({
        conversationId:
          leftConversationId,
      }: {
        conversationId: string;
      }) => {
        const normalizedLeftId =
          normalizeId(
            leftConversationId,
          );

        if (
          normalizedLeftId &&
          joinedConversationRef.current ===
            normalizedLeftId
        ) {
          joinedConversationRef.current =
            null;
        }

        console.log(
          "Conversation left:",
          normalizedLeftId,
        );
      },
    );

    // ==================================================
    // CONVERSATION ERROR
    // ==================================================

    socket.on(
      "conversation:error",
      (
        error: ConversationError,
      ) => {
        console.error(
          "❌ Conversation error:",
          error,
        );

        console.error(
          "Conversation ID:",
          conversationIdRef.current,
        );

        console.error(
          "Current user:",
          currentUserIdRef.current,
        );

        // Only clear the joined ref if the
        // error belongs to the currently joined
        // conversation.
        if (
          error.conversationId &&
          joinedConversationRef.current ===
            String(
              error.conversationId,
            )
        ) {
          joinedConversationRef.current =
            null;
        }
      },
    );

    // ==================================================
    // CONVERSATION READ UPDATE
    // ==================================================
    //
    // This event can arrive in two situations:
    //
    // 1. Current user read their own conversation
    // 2. Another user read messages sent by current user
    //
    // Current user:
    //     unreadCount = 0
    //
    // Other user:
    //     update readBy for message receipts
    //
    // ==================================================

    socket.on(
      "conversation:read:update",
      (
        data: ConversationReadUpdate,
      ) => {
        const {
          conversationId:
            readConversationId,
          userId,
          messageIds,
        } = data;

        const normalizedConversationId =
          normalizeId(
            readConversationId,
          );

        const normalizedUserId =
          normalizeId(userId);

        if (
          !normalizedConversationId ||
          !normalizedUserId
        ) {
          return;
        }

        const normalizedMessageIds =
          Array.isArray(messageIds)
            ? messageIds.map(
                String,
              )
            : [];

        const currentId =
          currentUserIdRef.current;

        const isCurrentUser =
          currentId !==
            undefined &&
          String(
            currentId,
          ) ===
            normalizedUserId;

        // ==================================================
        // CURRENT USER READ
        // ==================================================

        if (
          isCurrentUser
        ) {
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
                      normalizedConversationId,
                  );

                if (!conversation) {
                  return;
                }

                conversation.unreadCount =
                  0;
              },
            ),
          );
        }

        // ==================================================
        // UPDATE MESSAGE CACHE
        // ==================================================

        if (
          normalizedMessageIds.length >
          0
        ) {
          dispatch(
            messageApi.util.updateQueryData(
              "getMessages",
              {
                conversationId:
                  normalizedConversationId,

                page: 1,

                limit: 30,
              },
              (draft) => {
                normalizedMessageIds.forEach(
                  (messageId) => {
                    const message =
                      draft.messages.find(
                        (item) =>
                          String(
                            item._id,
                          ) ===
                          messageId,
                      );

                    if (!message) {
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
                          String(
                            id,
                          ) ===
                          normalizedUserId,
                      );

                    if (
                      !alreadyRead
                    ) {
                      message.readBy.push(
                        normalizedUserId,
                      );
                    }
                  },
                );
              },
            ),
          );
        }
      },
    );

    // ==================================================
    // USER BLOCKED
    // ==================================================

    socket.on(
      "user:blocked",
      ({
        blockerId,
        blockedId,
      }: UserBlockedEvent) => {
        const currentId =
          currentUserIdRef.current;

        if (!currentId) {
          return;
        }

        if (
          String(blockedId) !==
          String(currentId)
        ) {
          return;
        }

        onUserBlockedRef.current?.({
          blockerId:
            String(blockerId),

          blockedId:
            String(blockedId),
        });
      },
    );

    // ==================================================
    // USER UNBLOCKED
    // ==================================================

    socket.on(
      "user:unblocked",
      ({
        blockerId,
        blockedId,
      }: UserUnblockedEvent) => {
        const currentId =
          currentUserIdRef.current;

        if (!currentId) {
          return;
        }

        if (
          String(blockedId) !==
          String(currentId)
        ) {
          return;
        }

        onUserUnblockedRef.current?.({
          blockerId:
            String(blockerId),

          blockedId:
            String(blockedId),
        });
      },
    );

    // ==================================================
    // NEW MESSAGE
    // ==================================================

    socket.on(
      "message:new",
      (message: Message) => {
        const messageId =
          normalizeId(
            message._id,
          );

        if (!messageId) {
          return;
        }

        const messageConversationId =
          normalizeId(
            message.conversationId,
          );

        if (
          !messageConversationId
        ) {
          return;
        }

        // ----------------------------------------------
        // SYSTEM MESSAGE
        // ----------------------------------------------

        const isSystemMessage =
          message.type ===
          "system";

        // ----------------------------------------------
        // CURRENT CONVERSATION
        // ----------------------------------------------

        const selectedConversationId =
          conversationIdRef.current
            ? String(
                conversationIdRef.current,
              )
            : null;

        // ----------------------------------------------
        // SENDER
        // ----------------------------------------------

        const normalizedSenderId =
          normalizeId(
            message.senderId,
          );

        const normalizedCurrentUserId =
          currentUserIdRef.current
            ? String(
                currentUserIdRef.current,
              )
            : null;

        const isOwnMessage =
          normalizedSenderId !==
            null &&
          normalizedCurrentUserId !==
            null &&
          normalizedSenderId ===
            normalizedCurrentUserId;

        const isCurrentConversation =
          messageConversationId ===
          selectedConversationId;

        // ==================================================
        // NORMAL MESSAGE SOUND
        // ==================================================
        //
        // Play notification.mp3 for every incoming normal
        // message. This also works when the conversation is
        // brand-new and the user has not opened/joined that
        // conversation yet.
        //
        // Do NOT play for:
        // - system messages
        // - our own messages
        // ==================================================

        if (
          !isSystemMessage &&
          !isOwnMessage
        ) {
          playIncomingMessageSound();
        }

        // ----------------------------------------------
        // SENDER
        // ----------------------------------------------

        const sender =
          getPopulatedSender(
            message,
          );

        const senderName =
          sender?.name ||
          "New Message";

        const senderAvatar =
          sender?.avatar ||
          sender?.avatarUrl ||
          null;

        // ==================================================
        // NORMAL MESSAGE NOTIFICATION
        // ==================================================

        if (
          !isSystemMessage &&
          !isOwnMessage &&
          !isCurrentConversation &&
          typeof window !==
            "undefined"
        ) {
          emitChatNotification({
            title:
              senderName,

            body:
              getNotificationBody(
                message,
              ),

            conversationId:
              messageConversationId,

            messageId,

            senderId:
              normalizedSenderId,

            senderAvatar,
          });
        }

        // ==================================================
        // NORMAL MESSAGE DELIVERY
        // ==================================================

        if (
          !isSystemMessage &&
          normalizedSenderId &&
          !isOwnMessage
        ) {
          socket.emit(
            "message:delivered",
            {
              messageId,
            },
          );
        }

        // ==================================================
        // NORMAL MESSAGE READ
        // ==================================================
        //
        // If message arrives while current conversation
        // is open, immediately mark it as read.
        //
        // Therefore it will NOT increase unreadCount.
        //
        // ==================================================

        if (
          !isSystemMessage &&
          normalizedSenderId &&
          !isOwnMessage &&
          isCurrentConversation
        ) {
          markMessageAsRead(
            messageId,
          );
        }

        // ==================================================
        // MESSAGE CACHE
        // ==================================================

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
                    ) === messageId,
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

        // ==================================================
        // SIDEBAR CACHE
        // ==================================================

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
                // This is the important case for a NEW
                // conversation. The message arrived through
                // the personal user room, but this conversation
                // does not exist in the current sidebar cache.
                //
                // Refetch the conversation list so the new
                // conversation appears immediately without
                // a page reload.
                dispatch(
                  conversationApi.util.invalidateTags([
                    "Conversation",
                  ]),
                );

                return;
              }

              // --------------------------------------------
              // Update last message
              // --------------------------------------------

              conversation.lastMessage =
                message as typeof conversation.lastMessage;

              conversation.updatedAt =
                message.updatedAt ||
                message.createdAt;

              // --------------------------------------------
              // Increase unread count
              //
              // Only:
              // - normal message
              // - incoming message
              // - different conversation
              // --------------------------------------------

              if (
                !isSystemMessage &&
                !isOwnMessage &&
                !isCurrentConversation
              ) {
                conversation.unreadCount =
                  (
                    conversation.unreadCount ||
                    0
                  ) + 1;
              }

              // --------------------------------------------
              // Move conversation to top
              // --------------------------------------------

              const index =
                draft.findIndex(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    messageConversationId,
                );

              if (
                index > 0
              ) {
                const [
                  updatedConversation,
                ] =
                  draft.splice(
                    index,
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

    // ==================================================
    // DELIVERY UPDATE
    // ==================================================

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
                return;
              }

              if (
                !message.deliveredTo
              ) {
                message.deliveredTo =
                  [];
              }

              const exists =
                message.deliveredTo.some(
                  (id) =>
                    String(id) ===
                    String(userId),
                );

              if (!exists) {
                message.deliveredTo.push(
                  userId,
                );
              }
            },
          ),
        );
      },
    );

    // ==================================================
    // SINGLE MESSAGE READ UPDATE
    // ==================================================

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
                return;
              }

              if (
                !message.readBy
              ) {
                message.readBy =
                  [];
              }

              const exists =
                message.readBy.some(
                  (id) =>
                    String(id) ===
                    String(userId),
                );

              if (!exists) {
                message.readBy.push(
                  userId,
                );
              }
            },
          ),
        );
      },
    );

    // ==================================================
    // MESSAGE EDITED
    // ==================================================

    socket.on(
      "message:edited",
      (message: Message) => {
        const messageConversationId =
          normalizeId(
            message.conversationId,
          );

        if (
          !messageConversationId
        ) {
          return;
        }

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
              const existing =
                draft.messages.find(
                  (item) =>
                    String(
                      item._id,
                    ) ===
                    String(
                      message._id,
                    ),
                );

              if (!existing) {
                return;
              }

              existing.text =
                message.text;

              existing.isEdited =
                message.isEdited;

              existing.updatedAt =
                message.updatedAt;
            },
          ),
        );
      },
    );

    // ==================================================
    // MESSAGE DELETED
    // ==================================================

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

        deletedAt?:
          | string
          | null;
      }) => {
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
                return;
              }

              message.isDeleted =
                isDeleted;

              message.deletedAt =
                deletedAt ?? null;

              message.text =
                "";

              message.attachments =
                [];

              message.reactions =
                [];
            },
          ),
        );
      },
    );

    // ==================================================
    // REACTION UPDATE
    // ==================================================

    socket.on(
      "message:reaction:update",
      (
        reactionUpdate: MessageReactionUpdate,
      ) => {
        const {
          messageId,
          conversationId:
            reactionConversationId,
          reactionSummary,
        } =
          reactionUpdate;

        if (
          !messageId ||
          !reactionConversationId
        ) {
          return;
        }

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
                return;
              }

              message.reactions =
                reactionSummary;
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

        onTypingStartRef.current?.(
          String(userId),
        );
      },
    );

    // ==================================================
    // TYPING STOP
    // ==================================================

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

        onTypingStopRef.current?.(
          String(userId),
        );
      },
    );

    // ==================================================
    // CONNECT ERROR
    // ==================================================

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "❌ Socket connection error:",
          error.message,
        );
      },
    );

    // ==================================================
    // DISCONNECT
    // ==================================================

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "Socket disconnected:",
          reason,
        );

        joinedConversationRef.current =
          null;
      },
    );

    // ==================================================
    // CLEANUP
    // ==================================================

    return () => {
      const joinedConversation =
        joinedConversationRef.current;

      if (
        joinedConversation &&
        socket.connected
      ) {
        socket.emit(
          "conversation:leave",
          {
            conversationId:
              joinedConversation,
          },
        );
      }

      socket.removeAllListeners();

      socket.io.removeAllListeners();

      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current =
          null;
      }

      joinedConversationRef.current =
        null;
    };
  }, [
    token,
    currentUserId,
    dispatch,
    joinConversation,
    markConversationAsRead,
    markMessageAsRead,
    playIncomingMessageSound,
  ]);

  // ====================================================
  // CHANGE CONVERSATION
  // ====================================================

  useEffect(() => {
    const socket =
      socketRef.current;

    if (!socket) {
      return;
    }

    if (!socket.connected) {
      return;
    }

    joinConversation(
      conversationId,
    );
  }, [
    conversationId,
    joinConversation,
  ]);

  // ====================================================
  // SEND TYPING START
  // ====================================================

  const sendTypingStart =
    useCallback(() => {
      const socket =
        socketRef.current;

      const selectedConversationId =
        conversationIdRef.current;

      if (
        !socket ||
        !socket.connected ||
        !selectedConversationId
      ) {
        return;
      }

      socket.emit(
        "typing:start",
        {
          conversationId:
            selectedConversationId,
        },
      );
    }, []);

  // ====================================================
  // SEND TYPING STOP
  // ====================================================

  const sendTypingStop =
    useCallback(() => {
      const socket =
        socketRef.current;

      const selectedConversationId =
        conversationIdRef.current;

      if (
        !socket ||
        !socket.connected ||
        !selectedConversationId
      ) {
        return;
      }

      socket.emit(
        "typing:stop",
        {
          conversationId:
            selectedConversationId,
        },
      );
    }, []);

  // ====================================================
  // DELETE MESSAGE
  // ====================================================

  const deleteMessageRealtime =
    useCallback(
      (
        messageId: string,
      ) => {
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

        if (!messageId) {
          return false;
        }

        socket.emit(
          "message:delete",
          {
            messageId:
              String(messageId),
          },
        );

        return true;
      },
      [],
    );

  // ====================================================
  // EDIT MESSAGE
  // ====================================================

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

        if (
          !messageId ||
          !trimmedText
        ) {
          return false;
        }

        socket.emit(
          "message:edit",
          {
            messageId:
              String(messageId),

            text: trimmedText,
          },
        );

        return true;
      },
      [],
    );

  // ====================================================
  // REACTION
  // ====================================================

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

        if (
          !messageId ||
          !emoji
        ) {
          return false;
        }

        socket.emit(
          "message:reaction",
          {
            messageId:
              String(messageId),

            emoji,
          },
        );

        return true;
      },
      [],
    );

  // ====================================================
  // RETURN
  // ====================================================

  return {
    socket:
      socketRef.current,

    sendTypingStart,

    sendTypingStop,

    markMessageAsRead,

    markConversationAsRead,

    deleteMessageRealtime,

    editMessageRealtime,

    toggleMessageReactionRealtime,

    disconnectSocket,

    playIncomingMessageSound,
  };
}