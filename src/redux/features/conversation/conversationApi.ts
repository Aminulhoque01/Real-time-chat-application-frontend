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

// ==================================================
// RESPONSE TYPES
// ==================================================

interface ConversationMutationResponse {
  success: boolean;
  message: string;
  data: Conversation;
}

interface DeleteGroupResponse {
  success: boolean;
  message: string;
  data: {
    conversationId: string;
    deleted: boolean;
  };
}

// ==================================================
// API
// ==================================================

export const conversationApi =
  baseApi.injectEndpoints({
    endpoints: (builder) => ({

      // ==================================================
      // GET MY CONVERSATIONS
      // ==================================================

      getConversations:
        builder.query<
          Conversation[],
          void
        >({
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

      // ==================================================
      // CREATE DIRECT CONVERSATION
      // ==================================================

      createDirectConversation:
        builder.mutation<
          Conversation,
          CreateDirectConversationRequest
        >({
          query: (body) => ({
            url: "/conversation",
            method: "POST",
            body,
          }),

          transformResponse: (
            response: ConversationMutationResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: ["Conversation"],
        }),

      // ==================================================
      // CREATE GROUP
      // ==================================================

      createGroup:
        builder.mutation<
          Conversation,
          CreateGroupRequest
        >({
          query: (body) => ({
            url: "/conversation/group",
            method: "POST",
            body,
          }),

          transformResponse: (
            response: ConversationMutationResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: ["Conversation"],
        }),

      // ==================================================
      // ADD PARTICIPANTS
      // ==================================================

      addParticipants:
        builder.mutation<
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

          transformResponse: (
            response: ConversationMutationResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: ["Conversation"],
        }),

      // ==================================================
      // REMOVE PARTICIPANT / LEAVE GROUP
      // ==================================================

      removeParticipant:
        builder.mutation<
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

          transformResponse: (
            response: ConversationMutationResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: ["Conversation"],
        }),

      // ==================================================
      // PROMOTE ADMIN
      // ==================================================

      promoteAdmin:
        builder.mutation<
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

          transformResponse: (
            response: ConversationMutationResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: ["Conversation"],
        }),

      // ==================================================
      // RENAME GROUP
      // ==================================================

      renameGroup:
        builder.mutation<
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

          transformResponse: (
            response: ConversationMutationResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: ["Conversation"],
        }),

      // ==================================================
      // UPDATE GROUP PHOTO
      // ==================================================

      updateGroupPhoto:
        builder.mutation<
          Conversation,
          {
            conversationId: string;
            photo: File;
          }
        >({
          query: ({
            conversationId,
            photo,
          }) => {
            const formData =
              new FormData();

            formData.append(
              "photo",
              photo,
            );

            return {
              url: `/conversation/${conversationId}/photo`,
              method: "PATCH",
              body: formData,
            };
          },

          transformResponse: (
            response: ConversationMutationResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: [
            "Conversation",
          ],
        }),

      // ==================================================
      // DELETE GROUP
      // ==================================================

      deleteGroup:
        builder.mutation<
          DeleteGroupResponse["data"],
          string
        >({
          query: (
            conversationId,
          ) => ({
            url: `/conversation/${conversationId}`,
            method: "DELETE",
          }),

          transformResponse: (
            response: DeleteGroupResponse,
          ) => {
            return response.data;
          },

          invalidatesTags: [
            "Conversation",
          ],
        }),
    }),
  });

// ==================================================
// HOOKS
// ==================================================

export const {
  useGetConversationsQuery,
  useCreateDirectConversationMutation,
  useCreateGroupMutation,
  useAddParticipantsMutation,
  useRemoveParticipantMutation,
  usePromoteAdminMutation,
  useRenameGroupMutation,
  useUpdateGroupPhotoMutation,
  useDeleteGroupMutation,
} = conversationApi;