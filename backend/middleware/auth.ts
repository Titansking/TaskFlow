import { Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { sendResponse, unauthorizedResponse } from '../utils/response';
import { AuthenticatedRequest } from '../types/index';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      sendResponse(res, unauthorizedResponse('Access token is required'));
      return;
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      sendResponse(res, unauthorizedResponse('Invalid or expired token'));
      return;
    }
    
    // Attach user info to request
    req.user = decoded;
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
