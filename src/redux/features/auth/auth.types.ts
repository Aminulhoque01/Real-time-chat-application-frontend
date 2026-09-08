export interface User {
  _id: string;
  phone: string;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface AuthRequest {
  phone: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: User;
  };
}