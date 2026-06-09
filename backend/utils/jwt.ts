import jwt, { SignOptions } from 'jsonwebtoken';
import { IJWTPayload } from '../types/index';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';
// 7 days in seconds
const EXPIRES_IN_SECONDS = 7 * 24 * 60 * 60;

// Generate a secure JWT token containing the user ID, email, and role.
// This token is sent back to the frontend to prove the user is logged in.
export const generateToken = (
  userId: string,
  email: string,
  role: 'Admin' | 'Project Manager' | 'Team Member'
): string => {
  // Store the user info inside the token payload
  const payload: IJWTPayload = {
    userId,
    email,
    role,
  };

  // Set when the token should expire
  const options: SignOptions = {
    expiresIn: EXPIRES_IN_SECONDS,
  };

  // Sign and return the token string using our secret key
  return jwt.sign(payload, SECRET_KEY, options);
};

// Check if a token string is valid and return its decoded payload.
// Returns null if the token is fake, expired, or modified.
export const verifyToken = (token: string): IJWTPayload | null => {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as IJWTPayload;
    return decoded;
  } catch {
    return null; // Token is invalid
  }
};

// Decode the token payload without verifying its signature.
export const decodeToken = (token: string): IJWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as IJWTPayload;
    return decoded;
  } catch {
    return null;
  }
};

// Extract the raw token string from the HTTP "Authorization: Bearer <token>" header.
export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.split(' ')[1]; // Extract the token part
};
