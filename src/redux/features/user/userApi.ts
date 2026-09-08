

import { baseApi } from "../../api/baseApi";
import type { User } from "../auth/auth.types";

interface SingleUserResponse {
  success: boolean;
  message: string;
  data: User;
}

interface UsersResponse {
  success: boolean;
  message: string;
  data: User[];
}

interface UpdateProfileRequest {
  name?: string;
  bio?: string;
}

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // Get Single User
    // =========================

    getUserProfile: builder.query<User, string>({
      query: (userId) => ({
        url: `/users/${userId}`,
        method: "GET",
      }),

      transformResponse: (
        response: SingleUserResponse,
      ) => {
        return response.data;
      },

      providesTags: ["User"],
    }),

    // =========================
    // Search Users
    // =========================

    searchUsers: builder.query<User[], string>({
      query: (query) => ({
        url: "/users/search",
        method: "GET",
        params: {
          query,
        },
      }),

      transformResponse: (
        response: UsersResponse,
      ) => {
        return response.data;
      },
    }),

    // =========================
    // Update My Profile
    // =========================

    updateMyProfile: builder.mutation<
      User,
      UpdateProfileRequest
    >({
      query: (body) => ({
        url: "/users/me/profile",
        method: "PATCH",
        body,
      }),

      transformResponse: (
        response: SingleUserResponse,
      ) => {
        return response.data;
      },

      invalidatesTags: ["User", "Conversation"],
    }),

    // =========================
    // Update Avatar
    // =========================

    updateAvatar: builder.mutation<
      User,
      FormData
    >({
      query: (formData) => ({
        url: "/users/me/avatar",
        method: "PATCH",
        body: formData,
      }),

      transformResponse: (
        response: SingleUserResponse,
      ) => {
        return response.data;
      },

      invalidatesTags: [
        "User",
        "Conversation",
      ],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useSearchUsersQuery,
  useUpdateMyProfileMutation,
  useUpdateAvatarMutation,
} = userApi;