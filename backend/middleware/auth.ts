import { Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { forbiddenResponse, sendResponse, unauthorizedResponse } from '../utils/response';
import { AuthenticatedRequest } from '../types/index';

// Middleware to protect routes. It checks if the request has a valid login token.
// If valid, it attaches the user data to the request and lets the request continue.
// If invalid or missing, it blocks the request with a 401 Unauthorized response.
export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Extract the token from the HTTP Authorization header (e.g. "Bearer abc123xyz")
    const token = extractTokenFromHeader(req.headers.authorization);
    
    // If no token was sent, block the request
    if (!token) {
      sendResponse(res, unauthorizedResponse('Access token is required'));
      return;
    }
    
    // 2. Verify that the token is valid (not expired or fake)
    const decoded = verifyToken(token);
    
    // If invalid, block the request
    if (!decoded) {
      sendResponse(res, unauthorizedResponse('Invalid or expired token'));
      return;
    }
    
    // 3. Attach the decoded user payload to the request object so controllers can access it
    req.user = decoded;
    
    // 4. Continue to the next middleware or controller
    next();
  } catch (error) {
    sendResponse(res, unauthorizedResponse('Authentication failed'));
  }
};

// Optional auth - doesn't fail if no token, but attaches user if valid token exists
export const optionalAuthMiddleware = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

// Middleware to restrict access to specific user roles.
// For example, requireRole(['Admin']) only allows users with 'Admin' role to access a route.
export const requireRole = (roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    // 1. Ensure user is logged in (req.user exists)
    if (!req.user) {
      res.status(401).json(unauthorizedResponse('Authentication required'));
      return;
    }
    
    // 2. Check if the user's role is one of the allowed roles
    if (!roles.includes(req.user.role)) {
      res.status(403).json(forbiddenResponse('You do not have permission to perform this action'));
      return;
    }
    
    // 3. User is authorized! Continue to the next controller function.
    next();
  };
};
