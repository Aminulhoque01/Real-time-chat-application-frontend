

import { baseApi } from "../../api/baseApi";
import type {
  Message,
  MessagesResponse,
} from "./message.types";

interface GetMessagesParams {
  conversationId: string;
  page?: number;
  limit?: number;
}

export const messageApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
});

export const {
  useGetMessagesQuery,
} = messageApi;