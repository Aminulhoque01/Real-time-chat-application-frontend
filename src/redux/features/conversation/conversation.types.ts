import type { User } from "../auth/auth.types";

export type ConversationType = "direct" | "group";

export interface Conversation {
  _id: string;

  type: ConversationType;

  name?: string;

  participants: User[];

  admins?: Array<string | User>;

  lastMessage?: {
    _id?: string;
    text?: string;

    attachments?: Array<{
      type:
        | "image"
        | "video"
        | "audio"
        | "file";

      url?: string;
      name?: string;
    }>;

    createdAt?: string;
  };

  unreadCount?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationResponse {
  success: boolean;
  message: string;
  data: Conversation[];
}

/* =========================
   Direct Conversation
========================= */

export interface CreateDirectConversationRequest {
  participantId: string;
}

/* =========================
   Create Group
========================= */

export interface CreateGroupRequest {
  name: string;
  participantIds: string[];
}

/* =========================
   Add Participants
========================= */

export interface AddParticipantsRequest {
  conversationId: string;
  participantIds: string[];
}

/* =========================
   Remove Participant
========================= */

export interface RemoveParticipantRequest {
  conversationId: string;
  userId: string;
}

/* =========================
   Promote Admin
========================= */

export interface PromoteAdminRequest {
  conversationId: string;
  userId: string;
}

/* =========================
   Rename Group
========================= */

export interface RenameGroupRequest {
  conversationId: string;
  name: string;
}