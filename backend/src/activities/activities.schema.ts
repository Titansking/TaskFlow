/**
 * What a valid activity request looks like.
 */
import { z } from 'zod';
import { ACTIVITY_TYPES } from '../shared/types';
import { objectId } from '../users/users.schema';

export const createActivityBody = z.object({
  type: z.enum(ACTIVITY_TYPES),
  taskId: objectId.optional(),
  message: z.string().trim().min(1).max(300),
});

export type CreateActivityBody = z.infer<typeof createActivityBody>;