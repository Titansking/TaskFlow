/**
 * Every type in the app, plus the tiny functions that convert API data into
 * the shape components use.
 *
 * Two families of types, and the difference matters:
 *
 *   `*Dto` — exactly what the backend returns (`_id`). Only the mappers below
 *            ever touch these.
 *   `Task` — what components consume (`id`, aliased so it reads better).
 *
 * Dates are ISO strings because that is all JSON can carry; wrap them in
 * `new Date(...)` before formatting.
 */

/* -------------------------------------------------------------------------- */
/* Values shared across the UI                                                */
/* -------------------------------------------------------------------------- */

export const USER_ROLES = ['Admin', 'Project Manager', 'Team Member'] as const;
export type UserRole = (typeof USER_ROLES)[number];

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

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/** The panels the main area can switch between. */
export const VIEW_IDS = ['dashboard', 'kanban', 'calendar', 'analytics', 'timeline'] as const;
export type ViewId = (typeof VIEW_IDS)[number];

/* -------------------------------------------------------------------------- */
/* API shapes                                                                 */
/* -------------------------------------------------------------------------- */

export interface TaskDto {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assigneeId: string;
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDto {
  _id: string;
  name: string;
  color: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberDto {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityDto {
  _id: string;
  type: ActivityType;
  taskId?: string;
  userId: string;
  message: string;
  createdAt: string;
}

/** `{ items, pagination }` — what every list endpoint returns. */
export interface PageDto<T> {
  items: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

/** What `/auth/login` and `/auth/register` return. */
export interface AuthResultDto {
  user: TeamMemberDto;
  token: string;
}

/* -------------------------------------------------------------------------- */
/* Component-facing shapes                                                   */
/* -------------------------------------------------------------------------- */

/** Aliases the backend's `_id` to `id`. */
type WithId<T extends { _id: string }> = Omit<T, '_id'> & { id: string };

export type Task = WithId<TaskDto>;
export type Project = WithId<ProjectDto>;
export type TeamMember = WithId<TeamMemberDto>;
export type Activity = WithId<ActivityDto>;
export type Page<T> = Omit<PageDto<T>, 'items'> & { items: T[] };

/** What login and register return after mapping. */
export interface AuthResult {
  user: TeamMember;
  token: string;
}

/* -------------------------------------------------------------------------- */
/* Request payloads                                                           */
/* -------------------------------------------------------------------------- */

/** Fields the client may set when creating a task; the server owns the rest. */
export type TaskDraft = Pick<
  Task,
  'title' | 'description' | 'projectId' | 'assigneeId' | 'dueDate'
> &
  Partial<Pick<Task, 'status' | 'priority' | 'tags'>>;

/** Fields the client may change on an existing task. */
export type TaskChanges = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>;

export type ProjectDraft = Pick<Project, 'name' | 'color'> & { members?: string[] };

export type MemberDraft = Pick<TeamMember, 'name' | 'email'> & {
  password: string;
  role?: UserRole;
};

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration extends Credentials {
  name: string;
}

/* -------------------------------------------------------------------------- */
/* DTO -> UI mappers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The one rename the API forces on us: `_id` becomes `id`.
 *
 * Keeping it here means changing it later is a one-line edit rather than a
 * codebase-wide search.
 */
const withId = <T extends { _id: string }>(dto: T): T & { id: string } => ({
  ...dto,
  id: dto._id,
});

export const toTask = (dto: TaskDto): Task => withId(dto);
export const toProject = (dto: ProjectDto): Project => withId(dto);
export const toMember = (dto: TeamMemberDto): TeamMember => withId(dto);
export const toActivity = (dto: ActivityDto): Activity => withId(dto);

export const toTasks = (page: PageDto<TaskDto>): Page<Task> => ({
  ...page,
  items: page.items.map(toTask),
});

export const toProjects = (page: PageDto<ProjectDto>): Page<Project> => ({
  ...page,
  items: page.items.map(toProject),
});

export const toMembers = (page: PageDto<TeamMemberDto>): Page<TeamMember> => ({
  ...page,
  items: page.items.map(toMember),
});

export const toActivities = (page: PageDto<ActivityDto>): Page<Activity> => ({
  ...page,
  items: page.items.map(toActivity),
});