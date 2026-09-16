import { baseApi } from "../../api/baseApi";

import type {
AuthRequest,
AuthResponse,
User,
} from "./auth.types";

export interface BlockStatus {
isBlocked: boolean;
blockedByMe: boolean;
blockedByOther: boolean;
canUnblock: boolean;
}

export const authApi =
baseApi.injectEndpoints({
endpoints: (builder) => ({
// =========================
// Login
// =========================
login: builder.mutation<
AuthResponse,
AuthRequest
>({
query: (body) => ({
url: "/auth/login",
method: "POST",
body,
}),


    invalidatesTags: [
      "Auth",
      "User",
    ],
  }),

  // =========================
  // My Profile
  // =========================
  getMyProfile:
    builder.query<User, void>({
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

  // =========================
  // Get User Profile
  // =========================
  getUserProfile:
    builder.query<User, string>({
      query: (userId) => ({
        url: `/user/${userId}`,
        method: "GET",
      }),

      providesTags: (
        result,
        error,
        userId,
      ) => [
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

  // =========================
  // Update My Profile
  // =========================
  updateMyProfile:
    builder.mutation<
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

  // =========================
  // Update My Avatar
  // =========================
  updateMyAvatar:
    builder.mutation<
      User,
      FormData
    >({
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

  // =========================
  // Get Block Status
  // GET /api/block/status/:id
  // =========================
  getBlockStatus:
    builder.query<
      BlockStatus,
      string
    >({
      query: (userId) => ({
        url: `/block/status/${userId}`,
        method: "GET",
      }),

      providesTags: (
        result,
        error,
        userId,
      ) => [
        {
          type: "Block",
          id: userId,
        },
      ],

      transformResponse: (response: {
        success: boolean;
        data: BlockStatus;
      }) => {
        return response.data;
      },
    }),

  // =========================
  // Block User
  // POST /api/block/:id
  // =========================
  blockUser:
    builder.mutation<
      void,
      string
    >({
      query: (userId) => ({
        url: `/block/${userId}`,
        method: "POST",
      }),

      invalidatesTags: (
        result,
        error,
        userId,
      ) => [
        {
          type: "Block",
          id: userId,
        },
        {
          type: "User",
          id: userId,
        },
      ],
    }),

  // =========================
  // Unblock User
  // DELETE /api/block/:id
  // =========================
  unblockUser:
    builder.mutation<
      void,
      string
    >({
      query: (userId) => ({
        url: `/block/${userId}`,
        method: "DELETE",
      }),

      invalidatesTags: (
        result,
        error,
        userId,
      ) => [
        {
          type: "Block",
          id: userId,
        },
        {
          type: "User",
          id: userId,
        },
      ],
    }),
}),


});

export const {
useLoginMutation,
useGetMyProfileQuery,
useGetUserProfileQuery,
useGetBlockStatusQuery,
useBlockUserMutation,
useUnblockUserMutation,
useUpdateMyAvatarMutation,
useUpdateMyProfileMutation,
} = authApi;
