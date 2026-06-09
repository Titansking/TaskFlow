import { ApiResponse } from '../types/index';
import { Response } from 'express';

export const successResponse = <T = unknown>(
  data: T,
  message?: string,
  status: number = 200
): ApiResponse<T> => {
  return {
    status,
    success: true,
    data,
    message: message || 'Success',
  };
};

export const errorResponse = (
  message: string,
  status: number = 500
): ApiResponse => {
  return {
    status,
    success: false,
    message,
  };
};

export const sendResponse = <T = unknown>(
  res: Response,
  response: ApiResponse<T>
): Response => {
  return res.status(response.status).json(response);
};

// Common HTTP Status Responses
export const notFoundResponse = (message: string = 'Resource not found'): ApiResponse => {
  return errorResponse(message, 404);
};

export const unauthorizedResponse = (message: string = 'Unauthorized'): ApiResponse => {
  return errorResponse(message, 401);
};

export const forbiddenResponse = (message: string = 'Forbidden'): ApiResponse => {
  return errorResponse(message, 403);
};

export const badRequestResponse = (message: string = 'Bad request'): ApiResponse => {
  return errorResponse(message, 400);
};

export const createdResponse = <T = unknown>(
  data: T,
  message: string = 'Created successfully'
): ApiResponse<T> => {
  return successResponse(data, message, 201);
};
