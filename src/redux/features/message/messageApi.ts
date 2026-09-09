import { baseApi } from "@/src/redux/api/baseApi";
import type { Message, MessagesResponse } from "./message.types";

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

export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMessages: builder.query<MessagesResponse["data"], GetMessagesParams>({
      query: ({ conversationId, page = 1, limit = 30 }) => ({
        url: `/message/${conversationId}/messages`,
        method: "GET",
        params: {
          page,
          limit,
        },
      }),

      transformResponse: (response: MessagesResponse) => response.data,

      providesTags: (result, error, { conversationId }) => [
        {
          type: "Message",
          id: conversationId,
        },
      ],
    }),

    sendMessage: builder.mutation<Message, SendMessageRequest>({
      query: (body) => ({
        url: "/message",
        method: "POST",
        body,
      }),

      transformResponse: (response: SingleMessageResponse) => response.data,

      async onQueryStarted({ conversationId }, { dispatch, queryFulfilled }) {
        try {
          const { data: newMessage } = await queryFulfilled;

          dispatch(
            messageApi.util.updateQueryData(
              "getMessages",
              {
                conversationId,
                page: 1,
                limit: 30,
              },
              (draft) => {
                draft.messages.push(newMessage);
              },
            ),
          );
        } catch (error) {
          console.error("Failed to update message cache:", error);
        }
      },

      invalidatesTags: (result, error, { conversationId }) => [
        {
          type: "Message",
          id: conversationId,
        },
        "Conversation",
      ],
    }),
  }),
});

export const { useGetMessagesQuery, useSendMessageMutation } = messageApi;
