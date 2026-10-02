// src/redux/features/auth/auth.types.ts

// =========================
// User
// =========================

export interface User {
  _id: string;
  phone: string;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
  blockedUsers: string[];
}

// =========================
// Auth
// =========================

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

// =========================
// Profile
// =========================

export interface UpdateProfileRequest {
  name?: string;
  bio?: string;
}

export interface UpdateAvatarResponse {
  _id: string;
  phone: string;
  name: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
  blockedUsers: string[];
}

// =========================
// User Block
// =========================

export interface BlockStatusResponse {
  isBlocked: boolean;
  blockedByMe?: boolean;
  blockedByOther?: boolean;
  canUnblock?: boolean;
}

// =========================
// Users Pagination
// =========================

export interface UsersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// =========================
// Users List Data
// =========================

export interface UsersData {
  users: User[];
  pagination: UsersPagination;
}

// =========================
// Users API Response
// =========================

export interface UsersResponse {
  success: boolean;
  message: string;
  data: UsersData;
}

// =========================
// Get All Users Query
// =========================

export interface UsersQueryParams {
  search?: string;
  phone?: string;
  isOnline?: boolean;

  page?: number;
  limit?: number;

  sortBy?: "name" | "createdAt" | "updatedAt" | "lastSeen";

  sortOrder?: "asc" | "desc";
}

// =========================
// Search Users Query
// =========================

export interface SearchUsersParams {
  query: string;
  page?: number;
  limit?: number;
}