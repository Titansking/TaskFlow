/**
 * The vocabulary of the whole app: the closed sets of values, the types that
 * describe them, and the JSON shapes the API returns.
 *
 * Everything else imports from here, so changing a task status is one line.
 */

/* ------------------------------- constants -------------------------------- */

export const USER_ROLES = ['Admin', 'Project Manager', 'Team Member'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles allowed to create/delete projects and invite users. */
export const MANAGER_ROLES: readonly UserRole[] = ['Admin', 'Project Manager'];

export const USER_STATUSES = ['online', 'away', 'offline'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const TASK_STATUSES = ['todo', 'in-progress', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const ACTIVITY_TYPES = [
  'task_created',
  'task_updated',
  'task_completed',
  'comment',
  'member_joined',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Human labels for task statuses, used when writing activity messages. */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

/* --------------------------------- auth ----------------------------------- */

/** What we encode inside a JWT. `iat`/`exp` are added by the library. */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/* ---------------------------------- DTOs ---------------------------------- */

/**
 * Data Transfer Objects — the exact JSON the API returns.
 *
 * Two differences from the Mongoose models, both intentional: ids are strings
 * rather than ObjectIds, and a password hash never exists on a DTO.
 * Services convert documents into DTOs; nothing else sees a Mongoose type.
 */

export interface UserDto {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskDto {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDto {
  _id: string;
  name: string;
  color: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityDto {
  _id: string;
  type: ActivityType;
  taskId?: string;
  userId: string;
  message: string;
  createdAt: Date;
}

/** What `/auth/login` and `/auth/register` return. */
export interface AuthDto {
  user: UserDto;
  token: string;
}

/** Envelope returned by every list endpoint. */
export interface PageDto<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/* ------------------- Express: teach it about `req.user` -------------------- */

/**
 * `requireLogin` attaches the decoded token to the request. This declaration is
 * what lets every handler write `req.user.userId` without `any` casts.
 *
 * `namespace` is the only way to add a property to a class someone else owns,
 * so the lint rule is switched off here on purpose.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}
