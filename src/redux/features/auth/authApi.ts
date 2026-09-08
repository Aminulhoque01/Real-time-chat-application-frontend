

import { baseApi } from "../../api/baseApi";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from "./auth.types";

interface ProfileResponse {
  success: boolean;
  message: string;
  data: User;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    logout: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["Auth", "User"],
    }),

    getMyProfile: builder.query<User, void>({
      query: () => ({
        url: "/users/me",
        method: "GET",
      }),

      providesTags: ["User"],

      transformResponse: (
        response: ProfileResponse,
      ) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMyProfileQuery,
} = authApi;