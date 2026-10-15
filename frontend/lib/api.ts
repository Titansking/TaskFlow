/**
 * The only place in the app that talks to the backend.
 *
 * Three parts, in order:
 *
 *   1. An Axios instance with two interceptors, so nothing above this file
 *      ever sees a header, a token or a status code:
 *        - request  -> attach the bearer token
 *        - response -> unwrap the API envelope, and on 401 clear the session
 *                      and send the user to /login exactly once
 *
 *   2. Four tiny HTTP verbs that return the `data` field and nothing else.
 *
 *   3. One small service object per resource. Components call these; they
 *      never call Axios.
 */
import axios, { AxiosError } from 'axios';
import { TOKEN_KEY, USER_KEY, clearSession, storeSession, updateStoredUser } from './session';
import {
  toActivities,
  toMember,
  toMembers,
  toProject,
  toProjects,
  toTask,
  toTasks,
  type Activity,
  type ActivityDto,
  type AuthResult,
  type AuthResultDto,
  type Credentials,
  type MemberDraft,
  type Page,
  type PageDto,
  type Project,
  type ProjectDraft,
  type ProjectDto,
  type Registration,
  type Task,
  type TaskChanges,
  type TaskDraft,
  type TaskDto,
  type TeamMember,
  type TeamMemberDto,
  type UserRole,
  type UserStatus,
} from './types';

/* -------------------------------------------------------------------------- */
/* 1. Errors                                                                 */
/* -------------------------------------------------------------------------- */

/** A normalised, UI-friendly error. Components read `.message` and stop guessing. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/* -------------------------------------------------------------------------- */
/* 2. HTTP client                                                            */
/* -------------------------------------------------------------------------- */

const LOGIN_ROUTES = ['/login', '/register'];

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  // Success: hand the raw response back for the verbs below to unwrap.
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status ?? 0;

    // The session is dead: drop it and return to /login, unless already there.
    if (status === 401 && !LOGIN_ROUTES.some((route) => window.location.pathname.startsWith(route))) {
      clearSession();
      // A full navigation (not router.push) is deliberate: it discards every
      // in-memory cache belonging to the dead session.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign('/login');
    }

    return Promise.reject(
      new ApiError(error.response?.data?.message ?? error.message ?? 'Request failed', status),
    );
  },
);

/*
 * The four verbs below each return only the `data` field of the API's response
 * envelope, so no caller ever sees an AxiosResponse.
 */
const get = <T>(path: string, params?: Record<string, unknown>): Promise<T> =>
  api.get(path, { params }).then((response) => response.data.data);

const post = <T>(path: string, body: unknown): Promise<T> =>
  api.post(path, body).then((response) => response.data.data);

const put = <T>(path: string, body: unknown): Promise<T> =>
  api.put(path, body).then((response) => response.data.data);

const del = <T>(path: string): Promise<T> =>
  api.delete(path).then((response) => response.data.data);

/** How many records to pull on the first page of a list request. */
const PAGE_SIZE = 100;

/* -------------------------------------------------------------------------- */
/* 3. Services — one object per resource                                     */
/* -------------------------------------------------------------------------- */

export const authService = {
  async register(details: Registration): Promise<AuthResult> {
    return rememberSession(await post<AuthResultDto>('/auth/register', details));
  },

  async login(credentials: Credentials): Promise<AuthResult> {
    return rememberSession(await post<AuthResultDto>('/auth/login', credentials));
  },

  /** Re-reads the profile from the server and refreshes the cached copy. */
  async fetchProfile(): Promise<TeamMember> {
    const user = toMember(await get<TeamMemberDto>('/users/profile'));
    updateStoredUser(user);
    return user;
  },

  async updateProfile(changes: Partial<TeamMember>): Promise<TeamMember> {
    const user = toMember(await put<TeamMemberDto>('/users/profile', changes));
    updateStoredUser(user);
    return user;
  },
};

/** Stores the session in the shape the UI uses (`_id` becomes `id`). */
const rememberSession = ({ user, token }: AuthResultDto): AuthResult => {
  const member = toMember(user);
  storeSession(member, token);
  return { user: member, token };
};

export const taskService = {
  async list(): Promise<Task[]> {
    return (await taskService.listPage(1, PAGE_SIZE)).items;
  },

  listPage(page: number, limit: number): Promise<Page<Task>> {
    return get<PageDto<TaskDto>>('/tasks', { page, limit }).then(toTasks);
  },

  async create(draft: TaskDraft): Promise<Task> {
    return toTask(await post<TaskDto>('/tasks', draft));
  },

  async update(id: string, changes: TaskChanges): Promise<Task> {
    return toTask(await put<TaskDto>(`/tasks/${id}`, changes));
  },

  remove(id: string): Promise<unknown> {
    return del(`/tasks/${id}`);
  },
};

export const projectService = {
  async list(): Promise<Project[]> {
    return (await projectService.listPage(1, PAGE_SIZE)).items;
  },

  listPage(page: number, limit: number): Promise<Page<Project>> {
    return get<PageDto<ProjectDto>>('/projects', { page, limit }).then(toProjects);
  },

  async create(draft: ProjectDraft): Promise<Project> {
    return toProject(await post<ProjectDto>('/projects', draft));
  },

  remove(id: string): Promise<unknown> {
    return del(`/projects/${id}`);
  },
};

export const userService = {
  async list(): Promise<TeamMember[]> {
    return (await userService.listPage(1, PAGE_SIZE)).items;
  },

  listPage(page: number, limit: number): Promise<Page<TeamMember>> {
    return get<PageDto<TeamMemberDto>>('/users', { page, limit }).then(toMembers);
  },

  async get(id: string): Promise<TeamMember> {
    return toMember(await get<TeamMemberDto>(`/users/${id}`));
  },

  async create(draft: MemberDraft): Promise<TeamMember> {
    return toMember(await post<TeamMemberDto>('/users', draft));
  },

  async update(id: string, changes: { role?: UserRole; status?: UserStatus }): Promise<TeamMember> {
    return toMember(await put<TeamMemberDto>(`/users/${id}`, changes));
  },

  remove(id: string): Promise<unknown> {
    return del(`/users/${id}`);
  },
};

export const activityService = {
  async list(): Promise<Activity[]> {
    return (await activityService.listPage(1, PAGE_SIZE)).items;
  },

  listPage(page: number, limit: number): Promise<Page<Activity>> {
    return get<PageDto<ActivityDto>>('/activities', { page, limit }).then(toActivities);
  },
};

export { TOKEN_KEY, USER_KEY };
export default api;