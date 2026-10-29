/**
 * Task rules, including the side effects that belong with them: writing an
 * activity for every change, and cleaning up when a task is deleted.
 */
import type mongoose from 'mongoose';
import { ActivityModel } from '../activities/activities.model';
import { ProjectModel } from '../projects/projects.model';
import { UserModel } from '../users/users.model';
import { AppError } from '../shared/errors';
import { listOptions, paginate, toRawObject } from '../shared/http';
import {
  TASK_STATUS_LABELS,
  type ActivityType,
  type PageDto,
  type TaskDto,
  type TaskStatus,
} from '../shared/types';
import { TaskModel, type Task } from './tasks.model';
import type { CreateTaskBody, UpdateTaskBody } from './tasks.schema';
import type { PaginationQuery } from '../users/users.schema';

/** Mongo document -> JSON: ids become strings. */
const toDto = (doc: object): TaskDto => {
  const raw = toRawObject(doc);

  return {
    _id: String(raw._id),
    title: raw.title as string,
    description: raw.description as string,
    status: raw.status as TaskStatus,
    priority: raw.priority as TaskDto['priority'],
    projectId: String(raw.projectId),
    assigneeId: String(raw.assigneeId),
    dueDate: raw.dueDate as Date,
    tags: (raw.tags ?? []) as string[],
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
};

/**
 * Records a feed entry.
 *
 * Fire-and-forget on purpose: a failed activity log must never roll back the
 * task change the user just made, so we log the failure and move on.
 */
const logActivity = (entry: {
  type: ActivityType;
  userId: string;
  message: string;
  taskId: mongoose.Types.ObjectId;
}): void => {
  void ActivityModel.create(entry).catch((error) => {
    console.error('[activity] failed to record activity:', error);
  });
};

/** Works out which feed entry a status transition deserves. */
const describeStatusChange = (
  from: TaskStatus,
  to: TaskStatus,
  title: string,
  taskId: mongoose.Types.ObjectId,
): { type: ActivityType; message: string; taskId: mongoose.Types.ObjectId } => {
  if (from === to) return { type: 'task_updated', message: `updated task '${title}'`, taskId };

  if (to === 'done') return { type: 'task_completed', message: `completed task '${title}'`, taskId };

  return {
    type: 'task_updated',
    message: `moved task '${title}' to ${TASK_STATUS_LABELS[to]}`,
    taskId,
  };
};

/** Guards against a task pointing at a project or user that no longer exists. */
const assertReferencesExist = async (projectId: string, assigneeId: string): Promise<void> => {
  const [projectExists, assigneeExists] = await Promise.all([
    ProjectModel.exists({ _id: projectId }),
    UserModel.exists({ _id: assigneeId }),
  ]);

  if (!projectExists) throw AppError.badRequest('The selected project does not exist');
  if (!assigneeExists) throw AppError.badRequest('The selected assignee does not exist');
};

/* --------------------------------- reads ---------------------------------- */

export const listTasks = async (
  filter: { projectId?: string; status?: TaskStatus },
  query: PaginationQuery,
): Promise<PageDto<TaskDto>> => {
  const page = await paginate<Task>(TaskModel, filter, listOptions(query));
  return { ...page, items: page.items.map((doc) => toDto(doc as object)) };
};

/* --------------------------------- writes --------------------------------- */

export const createTask = async (body: CreateTaskBody, actorId: string): Promise<TaskDto> => {
  await assertReferencesExist(body.projectId, body.assigneeId);

  const task = await TaskModel.create({ ...body, tags: body.tags ?? [] });

  logActivity({
    type: 'task_created',
    userId: actorId,
    taskId: task._id,
    message: `created task '${task.title}'`,
  });

  return toDto(task);
};

export const updateTask = async (
  id: string,
  body: UpdateTaskBody,
  actorId: string,
): Promise<TaskDto> => {
  // Read the current status first — the activity message depends on the move.
  const previous = await TaskModel.findById(id).select('status').lean().exec();
  if (!previous) throw AppError.notFound('Task not found');

  const task = await TaskModel.findByIdAndUpdate(id, body, { new: true, runValidators: true }).exec();
  if (!task) throw AppError.notFound('Task not found');

  logActivity({ ...describeStatusChange(previous.status, task.status, task.title, task._id), userId: actorId });

  return toDto(task);
};

export const deleteTask = async (id: string): Promise<void> => {
  const task = await TaskModel.findByIdAndDelete(id).exec();
  if (!task) throw AppError.notFound('Task not found');

  // Keep the timeline consistent with the board.
  await ActivityModel.deleteMany({ taskId: task._id }).exec();
};