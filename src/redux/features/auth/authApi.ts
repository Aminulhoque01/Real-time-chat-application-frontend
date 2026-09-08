

import { baseApi } from "../../api/baseApi";
import type {
  AuthRequest,
  AuthResponse,
  User,
} from "./auth.types";

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
        url: "/users/me",
        method: "GET",
      }),
      providesTags: ["User"],

      transformResponse: (
        response: {
          success: boolean;
          message: string;
          data: User;
        },
      ) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMyProfileQuery,
} = authApi;