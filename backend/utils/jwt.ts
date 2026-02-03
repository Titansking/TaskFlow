import jwt, { SignOptions } from 'jsonwebtoken';
import { IJWTPayload } from '../types/index';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
// 7 days in seconds
const EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

export const generateToken = (userId: string, email: string): string => {
  const payload: IJWTPayload = {
    userId,
    email,
  };

  const options: SignOptions = {
    expiresIn: EXPIRES_IN_SECONDS,
  };

  return jwt.sign(payload, SECRET_KEY, options);
};

export const verifyToken = (token: string): IJWTPayload | null => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as IJWTPayload;
    return decoded;
  } catch {
    return null;
  }
};

export const decodeToken = (token: string): IJWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as IJWTPayload;
    return decoded;
  } catch {
    return null;
  }
};

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1];
};
