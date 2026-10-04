import {
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

const baseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,

  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const savedAuth =
        localStorage.getItem("chat_auth");

      if (savedAuth) {
        try {
          const parsedAuth = JSON.parse(savedAuth);

          const token = parsedAuth?.token;

          if (token) {
            headers.set(
              "Authorization",
              `Bearer ${token}`,
            );
          }
        } catch (error) {
          console.error(
            "Failed to parse auth token:",
            error,
          );
        }
      }
    }

    return headers;
  },
});

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,

  tagTypes: [
    "Auth",
    "User",
    "Conversation",
    "Message",
    "Block",
  ],

  endpoints: () => ({}),
});