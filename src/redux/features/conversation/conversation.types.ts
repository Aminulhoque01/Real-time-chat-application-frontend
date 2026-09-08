export interface ConversationUser {
  _id: string;
  phone: string;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface LastMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  text: string;
  attachments?: unknown[];
  isEdited?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ConversationType = "direct" | "group";

export interface Conversation {
  _id: string;
  type: ConversationType;
  name?: string;

  participants: ConversationUser[];

  admins: string[] | ConversationUser[];

  createdBy: string | ConversationUser;

  lastMessage: LastMessage | null;

  unreadCount: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface ConversationResponse {
  success: boolean;
  message: string;
  data: Conversation[];
}

export interface CreateDirectConversationRequest {
  participantId: string;
}

export interface CreateGroupRequest {
  name: string;
  participantIds: string[];
}

export interface AddParticipantsRequest {
  conversationId: string;
  participantIds: string[];
}

export interface RemoveParticipantRequest {
  conversationId: string;
  userId: string;
}

export interface PromoteAdminRequest {
  conversationId: string;
  userId: string;
}

export interface RenameGroupRequest {
  conversationId: string;
  name: string;
}