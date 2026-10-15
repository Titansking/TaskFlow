/**
 * All of TaskFlow's server state and the actions that mutate it.
 *
 * Why a hook instead of 20 `useState` calls in `app/page.tsx`:
 *
 *   1. One place answers "what does the app know?" — tasks, projects, people,
 *      activities, the signed-in user, and whether the first load finished.
 *   2. `app/page.tsx` becomes pure layout: it picks a view and renders it.
 *   3. Every state update is a functional update (`setTasks(prev => ...)`), so
 *      two quick actions can never clobber each other with a stale closure.
 *   4. Mutations are optimistic: the UI updates instantly and rolls back if the
 *      request fails, which is why `taskCounts` stays correct.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { activityService, projectService, taskService, userService } from '@/lib/api';
import { ApiError } from '@/lib/api';
import { redirectToLogin, useHasHydrated, useSession } from '@/lib/session';
import type {
  Activity,
  MemberDraft,
  Project,
  ProjectDraft,
  Task,
  TaskChanges,
  TaskDraft,
  TeamMember,
  UserRole,
  UserStatus,
} from '@/lib/types';

const messageOf = (error: unknown, fallback: string): string =>
  error instanceof ApiError ? error.message : fallback;

/** Case-insensitive substring match across title, description and tags. */
const matchesQuery = (task: Task, needle: string): boolean => {
  if (!needle) return true;
  const query = needle.toLowerCase();
  return (
    task.title.toLowerCase().includes(query) ||
    task.description.toLowerCase().includes(query) ||
    task.tags.some((tag) => tag.toLowerCase().includes(query))
  );
};

export const useTaskFlowData = () => {
  /* ----------------------------- server state ----------------------------- */

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  // The signed-in user comes from the external store, not from React state.
  const currentUser = useSession();
  const hasHydrated = useHasHydrated();
  // Depend on a primitive id: the store hands back a fresh object on every
  // write, and depending on the object would re-run the fetch below forever.
  const userId = currentUser?.id ?? null;

  /* ------------------------------ ui inputs ------------------------------- */

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ------------------------------ first load ------------------------------ */

  // The fetch waits until we are past hydration. Until then the user might
  // still be signed in -- `useSession` reports `null` for exactly one render
  // during hydration, and acting on that would log people out on refresh.
  useEffect(() => {
    if (!hasHydrated) return;

    if (!userId) {
      redirectToLogin();
      return;
    }

    let cancelled = false;

    // Four requests in parallel rather than four round trips in series.
    Promise.all([
      taskService.list(),
      projectService.list(),
      userService.list(),
      activityService.list(),
    ])
      .then(([tasksData, projectsData, membersData, activitiesData]) => {
        if (cancelled) return;
        setTasks(tasksData);
        setProjects(projectsData);
        setTeamMembers(membersData);
        setActivities(activitiesData);
      })
      .catch((cause: unknown) => {
        // A 401 has already redirected; anything else is worth showing.
        if (cancelled) return;
        if (!(cause instanceof ApiError && cause.status === 401)) {
          setError(messageOf(cause, 'Could not load your workspace'));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, userId]);

  /* ------------------------------- derived -------------------------------- */

  /** Tasks for the currently selected project, matching the search box. */
  const filteredTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (!selectedProject || task.projectId === selectedProject) &&
          matchesQuery(task, searchQuery),
      ),
    [tasks, selectedProject, searchQuery],
  );

  /** Counts shown in the sidebar. Computed once per change, not per render. */
  const taskCounts = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === 'todo').length,
      inProgress: tasks.filter((task) => task.status === 'in-progress').length,
      done: tasks.filter((task) => task.status === 'done').length,
    }),
    [tasks],
  );

  const canManageTeam =
    currentUser?.role === 'Admin' || currentUser?.role === 'Project Manager';
  const isAdmin = currentUser?.role === 'Admin';

  /* -------------------------------- actions ------------------------------- */

  /** Creates or updates depending on whether an id is present. */
  const saveTask = useCallback(async (task: Task | TaskDraft): Promise<void> => {
    try {
      if ('id' in task) {
        // Only send what the form owns; never echo back server-managed fields.
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...changes } = task;
        const updated = await taskService.update(task.id, changes as TaskChanges);
        setTasks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await taskService.create(task);
        setTasks((prev) => [created, ...prev]);
      }
      setError(null);
    } catch (cause) {
      setError(messageOf(cause, 'Could not save the task'));
      throw cause;
    }
  }, []);

  const removeTask = useCallback(async (id: string): Promise<void> => {
    const snapshot = tasks;

    setTasks((prev) => prev.filter((task) => task.id !== id));
    // Keep the timeline honest: the task is gone, so are its feed entries.
    setActivities((prev) => prev.filter((activity) => activity.taskId !== id));

    try {
      await taskService.remove(id);
    } catch (cause) {
      setTasks(snapshot);
      setActivities((prev) => prev);
      setError(messageOf(cause, 'Could not delete the task'));
      throw cause;
    }
  }, [tasks]);

  /** Drag-and-drop status change: optimistic, with a rollback on failure. */
  const moveTask = useCallback(async (id: string, status: Task['status']): Promise<void> => {
    const snapshot = tasks;
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, status } : task)));

    try {
      await taskService.update(id, { status });
    } catch (cause) {
      setTasks(snapshot);
      setError(messageOf(cause, 'Could not move the task'));
      throw cause;
    }
  }, [tasks]);

  const createProject = useCallback(async (draft: ProjectDraft): Promise<void> => {
    try {
      const project = await projectService.create(draft);
      setProjects((prev) => [...prev, project]);
    } catch (cause) {
      setError(messageOf(cause, 'Could not create the project'));
      throw cause;
    }
  }, []);

  const removeProject = useCallback(async (id: string): Promise<void> => {
    try {
      await projectService.remove(id);
      // The API cascades, so drop the project's tasks from local state too.
      setProjects((prev) => prev.filter((project) => project.id !== id));
      setTasks((prev) => prev.filter((task) => task.projectId !== id));
      setSelectedProject((current) => (current === id ? null : current));
    } catch (cause) {
      setError(messageOf(cause, 'Could not delete the project'));
      throw cause;
    }
  }, []);

  const addMember = useCallback(async (draft: MemberDraft): Promise<void> => {
    try {
      const member = await userService.create(draft);
      setTeamMembers((prev) => [...prev, member]);
    } catch (cause) {
      setError(messageOf(cause, 'Could not add the team member'));
      throw cause;
    }
  }, []);

  const changeMemberRole = useCallback(async (id: string, role: UserRole): Promise<void> => {
    try {
      const member = await userService.update(id, { role });
      setTeamMembers((prev) => prev.map((item) => (item.id === id ? member : item)));
    } catch (cause) {
      setError(messageOf(cause, 'Could not update the role'));
      throw cause;
    }
  }, []);

  const changeMemberStatus = useCallback(
    async (id: string, status: UserStatus): Promise<void> => {
      try {
        const member = await userService.update(id, { status });
        setTeamMembers((prev) => prev.map((item) => (item.id === id ? member : item)));
      } catch (cause) {
        setError(messageOf(cause, 'Could not update the status'));
        throw cause;
      }
    },
    [],
  );

  const removeMember = useCallback(async (id: string): Promise<void> => {
    try {
      await userService.remove(id);
      setTeamMembers((prev) => prev.filter((member) => member.id !== id));
    } catch (cause) {
      setError(messageOf(cause, 'Could not remove the team member'));
      throw cause;
    }
  }, []);

  const refresh = useCallback(async (): Promise<void> => {
    const [tasksData, projectsData, membersData, activitiesData] = await Promise.all([
      taskService.list(),
      projectService.list(),
      userService.list(),
      activityService.list(),
    ]);
    setTasks(tasksData);
    setProjects(projectsData);
    setTeamMembers(membersData);
    setActivities(activitiesData);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    // state
    tasks,
    projects,
    teamMembers,
    activities,
    currentUser,
    selectedProject,
    searchQuery,
    isLoading,
    error,
    // derived
    filteredTasks,
    taskCounts,
    canManageTeam,
    isAdmin,
    // actions
    setSelectedProject,
    setSearchQuery,
    saveTask,
    removeTask,
    moveTask,
    createProject,
    removeProject,
    addMember,
    changeMemberRole,
    changeMemberStatus,
    removeMember,
    refresh,
    dismissError,
  };
};

export type TaskFlowData = ReturnType<typeof useTaskFlowData>;