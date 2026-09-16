import { baseApi } from "../../api/baseApi";

import type { AuthRequest, AuthResponse, User } from "./auth.types";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, AuthRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),

      invalidatesTags: ["Auth", "User"],
    }),

    getMyProfile: builder.query<User, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),

      providesTags: ["User"],

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: User;
      }) => {
        return response.data;
      },
    }),

    getUserProfile: builder.query<User, string>({
      query: (userId) => ({
        url: `/user/${userId}`,
        method: "GET",
      }),

      providesTags: (result, error, userId) => [
        {
          type: "User",
          id: userId,
        },
      ],

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: User;
      }) => response.data,
    }),

    updateMyProfile: builder.mutation<
      User,
      {
        name: string;
        bio: string;
      }
    >({
      query: (body) => ({
        url: "/user/me/profile",
        method: "PATCH",
        body,
      }),

      invalidatesTags: ["User"],

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: User;
      }) => response.data,
    }),

    updateMyAvatar: builder.mutation<User, FormData>({
      query: (formData) => ({
        url: "/user/me/avatar",
        method: "PATCH",
        body: formData,
      }),

      invalidatesTags: ["User"],

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: User;
      }) => response.data,
    }),

    getBlockStatus: builder.query<{ isBlocked: boolean }, string>({
      query: (userId) => ({
        url: `/user/${userId}/block-status`,
        method: "GET",
      }),

      transformResponse: (response: {
        success: boolean;
        data: {
          isBlocked: boolean;
        };
      }) => response.data,
    }),

    blockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/user/${userId}/block`,
        method: "POST",
      }),

      invalidatesTags: (result, error, userId) => [
        {
          type: "User",
          id: userId,
        },
      ],
    }),

    unblockUser: builder.mutation<void, string>({
      query: (userId) => ({
        url: `/user/${userId}/block`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, userId) => [
        {
          type: "User",
          id: userId,
        },
      ],
    }),
  }),
});

export const { useLoginMutation, useGetMyProfileQuery, useGetUserProfileQuery,
  useGetBlockStatusQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useUpdateMyAvatarMutation,
 useUpdateMyProfileMutation
} = authApi;
