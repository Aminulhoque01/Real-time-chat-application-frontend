

import { baseApi } from "../../api/baseApi";
import type {
  AddParticipantsRequest,
  Conversation,
  ConversationResponse,
  CreateDirectConversationRequest,
  CreateGroupRequest,
  PromoteAdminRequest,
  RemoveParticipantRequest,
  RenameGroupRequest,
} from "./conversation.types";

export const conversationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // =========================
    // Get My Conversations
    // =========================
    getConversations: builder.query<Conversation[], void>({
      query: () => ({
        url: "/conversation",
        method: "GET",
      }),

      transformResponse: (
        response: ConversationResponse,
      ) => {
        return response.data;
      },

      providesTags: ["Conversation"],
    }),

    // =========================
    // Create Direct Conversation
    // =========================
    createDirectConversation: builder.mutation<
      Conversation,
      CreateDirectConversationRequest
    >({
      query: (body) => ({
        url: "/conversation",
        method: "POST",
        body,
      }),

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Conversation;
      }) => {
        return response.data;
      },

      invalidatesTags: ["Conversation"],
    }),

    // =========================
    // Create Group
    // =========================
    createGroup: builder.mutation<
      Conversation,
      CreateGroupRequest
    >({
      query: (body) => ({
        url: "/conversation/group",
        method: "POST",
        body,
      }),

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Conversation;
      }) => {
        return response.data;
      },

      invalidatesTags: ["Conversation"],
    }),

    // =========================
    // Add Participants
    // =========================
    addParticipants: builder.mutation<
      Conversation,
      AddParticipantsRequest
    >({
      query: ({
        conversationId,
        participantIds,
      }) => ({
        url: `/conversation/${conversationId}/participants`,
        method: "POST",
        body: {
          participantIds,
        },
      }),

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Conversation;
      }) => {
        return response.data;
      },

      invalidatesTags: ["Conversation"],
    }),

    // =========================
    // Remove Participant / Leave
    // =========================
    removeParticipant: builder.mutation<
      Conversation,
      RemoveParticipantRequest
    >({
      query: ({
        conversationId,
        userId,
      }) => ({
        url: `/conversation/${conversationId}/participants/${userId}`,
        method: "DELETE",
      }),

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Conversation;
      }) => {
        return response.data;
      },

      invalidatesTags: ["Conversation"],
    }),

    // =========================
    // Promote Admin
    // =========================
    promoteAdmin: builder.mutation<
      Conversation,
      PromoteAdminRequest
    >({
      query: ({
        conversationId,
        userId,
      }) => ({
        url: `/conversation/${conversationId}/admins`,
        method: "POST",
        body: {
          userId,
        },
      }),

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Conversation;
      }) => {
        return response.data;
      },

      invalidatesTags: ["Conversation"],
    }),

    // =========================
    // Rename Group
    // =========================
    renameGroup: builder.mutation<
      Conversation,
      RenameGroupRequest
    >({
      query: ({
        conversationId,
        name,
      }) => ({
        url: `/conversation/${conversationId}`,
        method: "PATCH",
        body: {
          name,
        },
      }),

      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Conversation;
      }) => {
        return response.data;
      },

      invalidatesTags: ["Conversation"],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useCreateDirectConversationMutation,
  useCreateGroupMutation,
  useAddParticipantsMutation,
  useRemoveParticipantMutation,
  usePromoteAdminMutation,
  useRenameGroupMutation,
} = conversationApi;