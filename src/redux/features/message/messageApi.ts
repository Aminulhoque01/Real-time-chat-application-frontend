import { baseApi } from "@/src/redux/api/baseApi";

import type {
  Message,
  MessagesResponse,
} from "./message.types";

interface GetMessagesParams {
  conversationId: string;
  page?: number;
  limit?: number;
}

export interface SendMessageRequest {
  conversationId: string;
  text?: string;
  replyTo?: string;
  attachments?: File[];
}

interface SingleMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export const messageApi =
  baseApi.injectEndpoints({
    endpoints: (builder) => ({
      // ========================================
      // GET MESSAGES
      // ========================================

      getMessages: builder.query<
        MessagesResponse["data"],
        GetMessagesParams
      >({
        query: ({
          conversationId,
          page = 1,
          limit = 30,
        }) => ({
          url: `/message/${conversationId}/messages`,
          method: "GET",
          params: {
            page,
            limit,
          },
        }),

        transformResponse: (
          response: MessagesResponse,
        ) => response.data,

        providesTags: (
          _result,
          _error,
          { conversationId },
        ) => [
          {
            type: "Message",
            id: conversationId,
          },
        ],
      }),

      // ========================================
      // SEND MESSAGE
      // ========================================

      sendMessage: builder.mutation<
        Message,
        SendMessageRequest
      >({
        query: ({
          conversationId,
          text,
          replyTo,
          attachments,
        }) => {
          // ====================================
          // FILE / VOICE / IMAGE / VIDEO MESSAGE
          // ====================================

          if (
            attachments &&
            attachments.length > 0
          ) {
            const formData = new FormData();

            formData.append(
              "conversationId",
              conversationId,
            );

            if (text?.trim()) {
              formData.append(
                "text",
                text.trim(),
              );
            }

            if (replyTo) {
              formData.append(
                "replyTo",
                replyTo,
              );
            }

            attachments.forEach(
              (file) => {
                formData.append(
                  "attachments",
                  file,
                );
              },
            );

            return {
              url: "/message",
              method: "POST",
              body: formData,
            };
          }

          // ====================================
          // NORMAL TEXT MESSAGE
          // ====================================

          return {
            url: "/message",
            method: "POST",
            body: {
              conversationId,

              ...(text?.trim()
                ? {
                    text: text.trim(),
                  }
                : {}),

              ...(replyTo
                ? {
                    replyTo,
                  }
                : {}),
            },
          };
        },

        transformResponse: (
          response: SingleMessageResponse,
        ) => response.data,

        // ========================================
        // UPDATE MESSAGE CACHE
        // ========================================

        async onQueryStarted(
          { conversationId },
          {
            dispatch,
            queryFulfilled,
          },
        ) {
          try {
            const {
              data: newMessage,
            } = await queryFulfilled;

            dispatch(
              messageApi.util.updateQueryData(
                "getMessages",
                {
                  conversationId,
                  page: 1,
                  limit: 30,
                },
                (draft) => {
                  // Prevent duplicate message
                  const exists =
                    draft.messages.some(
                      (message) =>
                        String(
                          message._id,
                        ) ===
                        String(
                          newMessage._id,
                        ),
                    );

                  if (exists) {
                    return;
                  }

                  // Add new message
                  draft.messages.push(
                    newMessage,
                  );

                  // Keep messages chronological
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
          } catch (error) {
            console.error(
              "Failed to update message cache:",
              error,
            );
          }
        },

        // ========================================
        // INVALIDATE CONVERSATION
        // ========================================

        invalidatesTags: [
          "Conversation",
        ],
      }),
    }),
  });

export const {
  useGetMessagesQuery,
  useSendMessageMutation,
} = messageApi;