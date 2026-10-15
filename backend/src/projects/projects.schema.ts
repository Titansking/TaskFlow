/**
 * What a valid project request looks like.
 */
import { z } from 'zod';
import { hexColor, objectId } from '../users/users.schema';

export const createProjectBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  color: hexColor,
  members: z.array(objectId).optional(),
});

export type CreateProjectBody = z.infer<typeof createProjectBody>;