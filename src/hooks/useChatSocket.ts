"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

import { useAppDispatch, useAppSelector } from "@/src/redux/hooks";

import { messageApi } from "@/src/redux/features/message/messageApi";
import type { Message } from "@/src/redux/features/message/message.types";

interface ChatSocketProps {
  conversationId: string | null;
}

export default function useChatSocket({
  conversationId,
}: ChatSocketProps) {
  const dispatch = useAppDispatch();

  const token = useAppSelector(
    (state) => state.auth.token,
  );

  const socketRef = useRef<Socket | null>(null);

  const joinedConversationRef = useRef<
    string | null
  >(null);

  useEffect(() => {
    if (!token) {
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

    // ==============================
    // CONNECT
    // ==============================

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id,
      );

      if (conversationId) {
        socket.emit("conversation:join", {
          conversationId,
        });

        joinedConversationRef.current =
          conversationId;

        console.log(
          "Joining conversation:",
          conversationId,
        );
      }
    });

    // ==============================
    // JOINED
    // ==============================

    socket.on(
      "conversation:joined",
      ({ conversationId }) => {
        console.log(
          "Conversation joined:",
          conversationId,
        );
      },
    );

    // ==============================
    // CONVERSATION ERROR
    // ==============================

    socket.on(
      "conversation:error",
      (error) => {
        console.error(
          "Conversation error:",
          error,
        );
      },
    );

    // ==============================
    // NEW MESSAGE
    // ==============================

    socket.on(
      "message:new",
      (message: Message) => {
        console.log(
          "REALTIME MESSAGE RECEIVED:",
          message,
        );

        if (
          message.conversationId !==
          conversationId
        ) {
          return;
        }

        dispatch(
          messageApi.util.updateQueryData(
            "getMessages",
            {
              conversationId,
              page: 1,
              limit: 30,
            },
            (draft) => {
              const exists =
                draft.messages.some(
                  (existingMessage) =>
                    existingMessage._id ===
                    message._id,
                );

              if (exists) {
                return;
              }

              draft.messages.push(message);

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
      },
    );

    // ==============================
    // CONNECTION ERROR
    // ==============================

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error.message,
        );
      },
    );

    // ==============================
    // DISCONNECT
    // ==============================

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "Socket disconnected:",
          reason,
        );
      },
    );

    // ==============================
    // CLEANUP
    // ==============================

    return () => {
      if (joinedConversationRef.current) {
        socket.emit("conversation:leave", {
          conversationId:
            joinedConversationRef.current,
        });
      }

      socket.disconnect();

      socketRef.current = null;
      joinedConversationRef.current = null;
    };
  }, [
    token,
    conversationId,
    dispatch,
  ]);
}