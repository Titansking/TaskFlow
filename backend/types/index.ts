import { Request } from 'express';

// JWT Payload Interface
export interface IJWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Extended Request with User
export interface AuthenticatedRequest extends Request {
  user?: IJWTPayload;
}

// User Interface
export interface IUser {
  _id: string;
  email: string;
  password: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task Interface
export interface ITask {
  _id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  userId: string;
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
