/**
 * Everything about "who is logged in": signing tokens, reading tokens, and the
 * two middlewares that guard routes.
 *
 *   requireLogin()      -> 401 unless a valid token is present
 *   requireRole([...])  -> 403 unless the user's role is in the allow-list
 */
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config';
import { AppError } from './errors';
import type { TokenPayload, UserRole } from './types';

/** Signs the token sent back after login/register. */
export const generateToken = (userId: string, email: string, role: UserRole): string =>
  jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as SignOptions);

/** Decoded payload, or `null` if the token is forged, expired or malformed. */
const readToken = (token: string | null): TokenPayload | null => {
  if (!token) return null;

  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
};

/** Pulls the raw token out of `Authorization: Bearer <token>`. */
const tokenFromHeader = (header?: string): string | null => {
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim() || null;
};

/** Mounted on a router: nothing below it runs without a valid token. */
export const requireLogin: RequestHandler = (req, _res, next): void => {
  const header = req.headers.authorization;
  const payload = readToken(tokenFromHeader(header));

  if (!payload) {
    // Say *which* problem it was: no token at all vs. a token we rejected.
    next(AppError.unauthorized(header ? 'Invalid or expired token' : 'Access token is required'));
    return;
  }

  // From here on any handler can read `req.user.userId` / `req.user.role`.
  req.user = payload;
  next();
};

/** Used after `requireLogin` to further restrict who may call a route. */
export const requireRole =
  (roles: readonly UserRole[]): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      next(AppError.forbidden());
      return;
    }
    next();
  };