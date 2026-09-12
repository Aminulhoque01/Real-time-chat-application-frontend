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
  type: "image" | "video" | "audio" | "file";
  url: string;
  publicId?: string;
  name?: string;
  size?: number;
  mimeType?: string;
}

export interface Message {
  deletedAt: string | null;
  _id: string;
  conversationId: string;

  senderId: string | MessageUser;

  text: string;

  attachments: MessageAttachment[];

  replyTo?: Message | string | null;

  isEdited?: boolean;

  isDeleted?: boolean;

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


