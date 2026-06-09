import api from '../lib/api';
import { Task, Project, TeamMember, Activity } from '../lib/types';
import { ApiResponse } from '../lib/api'; // We might need to export this from api.ts or define it

// Helper to map _id to id
const mapId = (item: any) => ({ ...item, id: item._id });

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const response = await api.get('/tasks');
    return response.data.data.map(mapId);
  },
  
  createTask: async (task: Omit<Task, 'id' | 'createdAt'>): Promise<Task> => {
    const response = await api.post('/tasks', task);
    return mapId(response.data.data);
  },

  updateTask: async (id: string, task: Partial<Task>): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, task);
    return mapId(response.data.data);
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  }
};

export const projectService = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/projects');
    return response.data.data.map(mapId);
  },

  createProject: async (project: Omit<Project, 'id'>): Promise<Project> => {
    const response = await api.post('/projects', project);
    return mapId(response.data.data);
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  }
};

export const userService = {
  getUsers: async (): Promise<TeamMember[]> => {
    const response = await api.get('/users');
    return response.data.data.map(mapId);
  },

  getUser: async (id: string): Promise<TeamMember> => {
    const response = await api.get(`/users/${id}`);
    return mapId(response.data.data);
  },

  createUser: async (user: Partial<TeamMember> & { password?: string }): Promise<TeamMember> => {
    const response = await api.post('/users', user);
    return mapId(response.data.data);
  },

  updateUser: async (id: string, data: Partial<TeamMember>): Promise<TeamMember> => {
    const response = await api.put(`/users/${id}`, data);
    return mapId(response.data.data);
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  }
};

export const activityService = {
  getActivities: async (): Promise<Activity[]> => {
    const response = await api.get('/activities');
    return response.data.data.map(mapId);
  }
};
