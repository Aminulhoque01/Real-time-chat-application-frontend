// import { baseApi } from "../../api/baseApi";

// import type {
// AuthRequest,
// AuthResponse,
// User,
// } from "./auth.types";

// export interface BlockStatus {
// isBlocked: boolean;
// blockedByMe: boolean;
// blockedByOther: boolean;
// canUnblock: boolean;
// }

// export const authApi =
// baseApi.injectEndpoints({
// endpoints: (builder) => ({
// // =========================
// // Login
// // =========================
// login: builder.mutation<
// AuthResponse,
// AuthRequest
// >({
// query: (body) => ({
// url: "/auth/login",
// method: "POST",
// body,
// }),

//     invalidatesTags: [
//       "Auth",
//       "User",
//     ],
//   }),

//   // =========================
//   // My Profile
//   // =========================
//   getMyProfile:
//     builder.query<User, void>({
//       query: () => ({
//         url: "/auth/me",
//         method: "GET",
//       }),

//       providesTags: ["User"],

//       transformResponse: (response: {
//         success: boolean;
//         message: string;
//         data: User;
//       }) => {
//         return response.data;
//       },
//     }),

//   // =========================
//   // Get User Profile
//   // =========================
//   getUserProfile:
//     builder.query<User, string>({
//       query: (userId) => ({
//         url: `/user/${userId}`,
//         method: "GET",
//       }),

//       providesTags: (
//         result,
//         error,
//         userId,
//       ) => [
//         {
//           type: "User",
//           id: userId,
//         },
//       ],

//       transformResponse: (response: {
//         success: boolean;
//         message: string;
//         data: User;
//       }) => response.data,
//     }),

//   // =========================
//   // Update My Profile
//   // =========================
//   updateMyProfile:
//     builder.mutation<
//       User,
//       {
//         name: string;
//         bio: string;
//       }
//     >({
//       query: (body) => ({
//         url: "/user/me/profile",
//         method: "PATCH",
//         body,
//       }),

//       invalidatesTags: ["User"],

//       transformResponse: (response: {
//         success: boolean;
//         message: string;
//         data: User;
//       }) => response.data,
//     }),

//   // =========================
//   // Update My Avatar
//   // =========================
//   updateMyAvatar:
//     builder.mutation<
//       User,
//       FormData
//     >({
//       query: (formData) => ({
//         url: "/user/me/avatar",
//         method: "PATCH",
//         body: formData,
//       }),

//       invalidatesTags: ["User"],

//       transformResponse: (response: {
//         success: boolean;
//         message: string;
//         data: User;
//       }) => response.data,
//     }),

//   // =========================
//   // Get Block Status
//   // GET /api/block/status/:id
//   // =========================
//   getBlockStatus:
//     builder.query<
//       BlockStatus,
//       string
//     >({
//       query: (userId) => ({
//         url: `/block/status/${userId}`,
//         method: "GET",
//       }),

//       providesTags: (
//         result,
//         error,
//         userId,
//       ) => [
//         {
//           type: "Block",
//           id: userId,
//         },
//       ],

//       transformResponse: (response: {
//         success: boolean;
//         data: BlockStatus;
//       }) => {
//         return response.data;
//       },
//     }),

//   // =========================
//   // Block User
//   // POST /api/block/:id
//   // =========================
//   blockUser:
//     builder.mutation<
//       void,
//       string
//     >({
//       query: (userId) => ({
//         url: `/block/${userId}`,
//         method: "POST",
//       }),

//       invalidatesTags: (
//         result,
//         error,
//         userId,
//       ) => [
//         {
//           type: "Block",
//           id: userId,
//         },
//         {
//           type: "User",
//           id: userId,
//         },
//       ],
//     }),

//   // =========================
//   // Unblock User
//   // DELETE /api/block/:id
//   // =========================
//   unblockUser:
//     builder.mutation<
//       void,
//       string
//     >({
//       query: (userId) => ({
//         url: `/block/${userId}`,
//         method: "DELETE",
//       }),

//       invalidatesTags: (
//         result,
//         error,
//         userId,
//       ) => [
//         {
//           type: "Block",
//           id: userId,
//         },
//         {
//           type: "User",
//           id: userId,
//         },
//       ],
//     }),
// }),

// });

// export const {
// useLoginMutation,
// useGetMyProfileQuery,
// useGetUserProfileQuery,
// useGetBlockStatusQuery,
// useBlockUserMutation,
// useUnblockUserMutation,
// useUpdateMyAvatarMutation,
// useUpdateMyProfileMutation,
// } = authApi;

import { baseApi } from "../../api/baseApi";

import type {
  User,
  UpdateProfileRequest,
  UpdateAvatarResponse,
  BlockStatusResponse,
} from "./auth.types";

/**
 * ==========================================
 * Response Types
 * ==========================================
 */

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface UsersQueryParams {
  search?: string;
  phone?: string;
  isOnline?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "name" | "createdAt" | "updatedAt" | "lastSeen";
  sortOrder?: "asc" | "desc";
}

interface UsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UsersData {
  users: User[];
  pagination: UsersPagination;
}

interface UsersResponse {
  success: boolean;
  message: string;
  data: UsersData;
}

/**
 * ==========================================
 * Search Users Response
 * ==========================================
 */

interface SearchUsersParams {
  query: string;
  page?: number;
  limit?: number;
}

/**
 * ==========================================
 * Auth API
 * ==========================================
 */

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * ======================================
     * Login
     * ======================================
     */
    login: builder.mutation<
      ApiResponse<{
        user: User;
        token: string;
      }>,
      {
        phone: string;
        name?: string;
      }
    >({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),

    /**
     * ======================================
     * Get My Profile
     *
     * GET /api/auth/me
     * ======================================
     */
    getMyProfile: builder.query<User, void>({
      query: () => ({
        url: "/auth/me",
        method: "GET",
      }),

      transformResponse: (response: ApiResponse<User>) => response.data,

      providesTags: ["User"],
    }),

    /**
     * ======================================
     * Get User Profile
     *
     * GET /api/user/:id
     *
     * Keep your existing endpoint here
     * if this is already used elsewhere.
     * ======================================
     */
    getUserProfile: builder.query<User, string>({
      query: (userId) => ({
        url: `/user/${userId}`,
        method: "GET",
      }),

      transformResponse: (response: ApiResponse<User>) => response.data,

      providesTags: ["User"],
    }),

    /**
     * ======================================
     * GET ALL USERS
     *
     * GET /api/users
     *
     * Example:
     * /users?page=1&limit=100
     * ======================================
     */
    getAllUsers: builder.query<UsersData, UsersQueryParams | void>({
      query: (params) => ({
        url: "/user",
        method: "GET",
        params: params ?? {
          page: 1,
          limit: 100,
          sortBy: "name",
          sortOrder: "asc",
        },
      }),

      transformResponse: (response: UsersResponse) => response.data,

      providesTags: ["User"],
    }),

    /**
     * ======================================
     * SEARCH USERS
     *
     * GET /api/users/search?query=rahim
     * ======================================
     */
    searchUsers: builder.query<UsersData, SearchUsersParams>({
      query: ({ query, page = 1, limit = 20 }) => ({
        url: "/user/search",
        method: "GET",
        params: {
          query,
          page,
          limit,
        },
      }),

      transformResponse: (response: UsersResponse) => response.data,

      providesTags: ["User"],
    }),

    /**
     * ======================================
     * Update My Profile
     *
     * PATCH /api/user/me/profile
     * ======================================
     */
    updateMyProfile: builder.mutation<User, UpdateProfileRequest>({
      query: (body) => ({
        url: "/user/me/profile",
        method: "PATCH",
        body,
      }),

      transformResponse: (response: ApiResponse<User>) => response.data,

      invalidatesTags: ["User"],
    }),

    /**
     * ======================================
     * Update My Avatar
     *
     * PATCH /api/user/me/avatar
     * ======================================
     */
    updateMyAvatar: builder.mutation<UpdateAvatarResponse, FormData>({
      query: (formData) => ({
        url: "/user/me/avatar",
        method: "PATCH",
        body: formData,
      }),

      transformResponse: (response: ApiResponse<UpdateAvatarResponse>) =>
        response.data,

      invalidatesTags: ["User"],
    }),

    /**
     * ======================================
     * Block Status
     * ======================================
     */
    getBlockStatus: builder.query<BlockStatusResponse, string>({
      query: (userId) => ({
        url: `/block/status/${userId}`,
        method: "GET",
      }),

      transformResponse: (response: ApiResponse<BlockStatusResponse>) =>
        response.data,

      providesTags: ["Block"],
    }),

    /**
     * ======================================
     * Block User
     * ======================================
     */
    blockUser: builder.mutation<unknown, string>({
      query: (userId) => ({
        url: `/block/${userId}`,
        method: "POST",
      }),

      invalidatesTags: ["Block", "User"],
    }),

    /**
     * ======================================
     * Unblock User
     * ======================================
     */
    unblockUser: builder.mutation<unknown, string>({
      query: (userId) => ({
        url: `/block/${userId}`,
        method: "DELETE",
      }),

      invalidatesTags: ["Block", "User"],
    }),
  }),

  overrideExisting: false,
});

/**
 * ==========================================
 * Hooks
 * ==========================================
 */

export const {
  useLoginMutation,

  useGetMyProfileQuery,
  useGetUserProfileQuery,

  useGetAllUsersQuery,
  useSearchUsersQuery,

  useUpdateMyProfileMutation,
  useUpdateMyAvatarMutation,

  useGetBlockStatusQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
} = authApi;
