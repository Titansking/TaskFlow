/**
 * What a valid task request looks like.
 */
import { z } from 'zod';
import { TASK_PRIORITIES, TASK_STATUSES } from '../shared/types';
import { objectId, pagination } from '../users/users.schema';

export const createTaskBody = z.object({
  title: z.string().trim().min(1, 'Title is required').max(160),
  description: z.string().trim().min(1, 'Description is required').max(4000),
  status: z.enum(TASK_STATUSES).optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  projectId: objectId,
  assigneeId: objectId,
  dueDate: z.coerce.date({ error: 'Must be a valid date' }),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).optional(),
});

/** A partial update — only send the fields that actually changed. */
export const updateTaskBody = createTaskBody
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

/** `GET /tasks` accepts pagination plus optional filters. */
export const listTasksQuery = pagination.extend({
  projectId: objectId.optional(),
  status: z.enum(TASK_STATUSES).optional(),
});

export type CreateTaskBody = z.infer<typeof createTaskBody>;
export type UpdateTaskBody = z.infer<typeof updateTaskBody>;