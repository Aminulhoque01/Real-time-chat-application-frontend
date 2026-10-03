export interface MessageUser {
  _id: string;
  phone: string;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface MessageAttachment {
  fileName: string;
  type: "image" | "video" | "audio" | "file";
  url: string;
  publicId?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export type MessageType = "text" | "system";

export interface Message {
  _id: string;

  conversationId: string;

  senderId: string | MessageUser;

  /**
   * Normal chat message or system/activity message.
   *
   * text:
   *   Normal user message
   *
   * system:
   *   Group activity such as:
   *   "Aminul left this group"
   *   "Aminul removed Rahim from this group"
   */
  type: MessageType;

  text: string;

  attachments: MessageAttachment[];

  replyTo?: Message | string | null;

  isEdited?: boolean;

  isDeleted?: boolean;

  deletedAt: string | null;

  deliveredTo?: string[];

  readBy?: string[];

  reactions?: unknown[];

  createdAt: string;

  updatedAt: string;
}

export interface DeleteMessageResponse {
  success: boolean;
  message: string;
  data: {
    messageId: string;
    conversationId: string;
    isDeleted: boolean;
    deletedAt: string | null;
  };
}

export interface MessagePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MessagesResponse {
  success: boolean;
  message: string;
  data: {
    messages: Message[];
    pagination: MessagePagination;
  };
}