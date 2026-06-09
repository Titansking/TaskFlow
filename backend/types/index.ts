import { Request } from 'express';

// JWT Payload Interface
// This interface defines the data that we store inside the JWT token.
// The token is a secure string that represents a logged-in session.
export interface IJWTPayload {
  userId: string; // The database ID of the user
  email: string;  // The email address of the user
  role: 'Admin' | 'Project Manager' | 'Team Member'; // The security role of the user
  iat?: number;   // Automatically added: Issued At timestamp
  exp?: number;   // Automatically added: Expiry timestamp
}

// This extends the standard Express Request object.
// It allows us to access the logged-in user's details via `req.user` in controllers.
export interface AuthenticatedRequest extends Request {
  user?: IJWTPayload; // The decoded token payload (only present if logged in)
}

// User Interface
export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Project Manager' | 'Team Member';
  avatar: string;
  status: 'online' | 'away' | 'offline';
  createdAt: Date;
  updatedAt: Date;
}

// Task Interface
export interface ITask {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  projectId: string;
  assigneeId: string;
  dueDate: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  status: number;
  success: boolean;
  data?: T;
  message?: string;
}

// Pagination Interface
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
