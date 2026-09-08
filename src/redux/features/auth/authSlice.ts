import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { User } from "./auth.types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<User>,
    ) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },

    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const {
  setCredentials,
  clearCredentials,
} = authSlice.actions;

export default authSlice.reducer;