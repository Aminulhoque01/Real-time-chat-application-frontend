import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";



export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: fetchBaseQuery({
    baseUrl:
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api",

    credentials: "include",

    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;

      const token = state.auth.token;

      if (token) {
        headers.set(
          "Authorization",
          `Bearer ${token}`,
        );
      }

      return headers;
    },
  }),

  tagTypes: [
    "Auth",
    "User",
    "Conversation",
    "Message",
  ],

  endpoints: () => ({}),
});