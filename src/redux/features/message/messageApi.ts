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

interface SendMessageRequest {
  conversationId: string;
  text?: string;
  replyTo?: string;
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
          result,
          error,
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
        query: (body) => ({
          url: "/message",
          method: "POST",
          body,
        }),

        transformResponse: (
          response: SingleMessageResponse,
        ) => response.data,

        // --------------------------------------
        // Update sender's message cache
        // --------------------------------------

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

                  draft.messages.push(
                    newMessage,
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
          } catch (error) {
            console.error(
              "Failed to update message cache:",
              error,
            );
          }
        },

        // --------------------------------------
        // IMPORTANT:
        //
        // Do NOT invalidate Message here.
        //
        // Otherwise RTK Query may immediately
        // refetch and replace our cache update.
        // --------------------------------------

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