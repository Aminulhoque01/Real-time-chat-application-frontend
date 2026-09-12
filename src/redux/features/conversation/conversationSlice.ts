import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ConversationState {
  unreadCounts: Record<string, number>;
}

const initialState: ConversationState = {
  unreadCounts: {},
};

const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    incrementUnreadCount: (
      state,
      action: PayloadAction<string>,
    ) => {
      const conversationId = action.payload;

      state.unreadCounts[conversationId] =
        (state.unreadCounts[conversationId] || 0) + 1;
    },

    clearUnreadCount: (
      state,
      action: PayloadAction<string>,
    ) => {
      const conversationId = action.payload;

      state.unreadCounts[conversationId] = 0;
    },

    setUnreadCount: (
      state,
      action: PayloadAction<{
        conversationId: string;
        count: number;
      }>,
    ) => {
      const { conversationId, count } = action.payload;

      state.unreadCounts[conversationId] = count;
    },

    resetUnreadCounts: (state) => {
      state.unreadCounts = {};
    },
  },
});

export const {
  incrementUnreadCount,
  clearUnreadCount,
  setUnreadCount,
  resetUnreadCounts,
} = conversationSlice.actions;

export default conversationSlice.reducer;