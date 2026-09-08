import {
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

import type { User } from "./auth.types";

interface AuthState {
  user: User | null;
  token: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        user: User;
        token: string;
      }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;

      if (typeof window !== "undefined") {
        localStorage.setItem(
          "chat_auth",
          JSON.stringify({
            user: action.payload.user,
            token: action.payload.token,
          }),
        );
      }
    },

    restoreAuth: (state) => {
      if (typeof window === "undefined") {
        state.hydrated = true;
        return;
      }

      const savedAuth =
        localStorage.getItem("chat_auth");

      if (!savedAuth) {
        state.hydrated = true;
        return;
      }

      try {
        const parsedAuth = JSON.parse(savedAuth);

        state.user = parsedAuth.user ?? null;
        state.token = parsedAuth.token ?? null;
      } catch (error) {
        console.error(
          "Failed to restore authentication:",
          error,
        );

        localStorage.removeItem("chat_auth");

        state.user = null;
        state.token = null;
      }

      state.hydrated = true;
    },

    updateUser: (
      state,
      action: PayloadAction<User>,
    ) => {
      state.user = action.payload;

      if (typeof window !== "undefined") {
        const savedAuth =
          localStorage.getItem("chat_auth");

        if (savedAuth) {
          try {
            const parsedAuth = JSON.parse(savedAuth);

            localStorage.setItem(
              "chat_auth",
              JSON.stringify({
                ...parsedAuth,
                user: action.payload,
              }),
            );
          } catch {
            // Ignore invalid localStorage data
          }
        }
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.hydrated = true;

      if (typeof window !== "undefined") {
        localStorage.removeItem("chat_auth");
      }
    },
  },
});

export const {
  setCredentials,
  restoreAuth,
  updateUser,
  logout,
} = authSlice.actions;

export default authSlice.reducer;