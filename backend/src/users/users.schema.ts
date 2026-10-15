/**
 * What a valid request body looks like, for this feature.
 *
 * The route runs these with `check()` before anything else happens, so the
 * service always receives clean, already-coerced data.
 */
import { z } from 'zod';
import { USER_ROLES, USER_STATUSES } from '../shared/types';

/* ------------------------------ shared bits ------------------------------- */

export const objectId = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, 'Must be a valid id');

export const email = z.string().trim().toLowerCase().email('Must be a valid email address');

/** 8 chars minimum, and not purely numeric (trivial to brute force). */
export const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((value) => /\d/.test(value) && /[a-zA-Z]/.test(value), {
    message: 'Password must contain at least one letter and one number',
  });

export const fullName = z.string().trim().min(1, 'Name is required').max(80);

export const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour such as #3b82f6');

/** Every list endpoint accepts the same pagination query. */
/**
 * The shared pagination query. Exported here (rather than from a central
 * schemas file) because this folder holds the reusable building blocks that
 * the other features import.
 */
export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  sortBy: z.string().min(1).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Already coerced and defaulted by the `pagination` schema above. */
export type PaginationQuery = z.infer<typeof pagination>;

/* --------------------------------- auth ----------------------------------- */

export const registerBody = z.object({
  name: fullName,
  email,
  password: strongPassword,
});

export const loginBody = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

/* --------------------------------- users ---------------------------------- */

export const createUserBody = z.object({
  name: fullName,
  email,
  password: strongPassword,
  role: z.enum(USER_ROLES).optional(),
});

export const updateProfileBody = z
  .object({
    name: fullName,
    email,
    avatar: z.string().trim().min(1).max(2),
    status: z.enum(USER_STATUSES),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export const updateUserBody = z
  .object({
    role: z.enum(USER_ROLES),
    status: z.enum(USER_STATUSES),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

export type RegisterBody = z.infer<typeof registerBody>;
export type LoginBody = z.infer<typeof loginBody>;
export type CreateUserBody = z.infer<typeof createUserBody>;
export type UpdateProfileBody = z.infer<typeof updateProfileBody>;
export type UpdateUserBody = z.infer<typeof updateUserBody>;