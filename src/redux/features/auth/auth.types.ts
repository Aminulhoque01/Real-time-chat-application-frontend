export interface User {
  _id: string;
  phone: string;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
  };
}

export interface RegisterRequest {
  phone: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}