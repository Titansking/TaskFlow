import api from '../lib/api';
import { TeamMember } from '../lib/types';

interface AuthResponse {
  user: TeamMember;
  token: string;
}

export const authService = {
  register: async (data: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  login: async (data: any): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  },

  getCurrentUser: (): TeamMember | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  updateProfile: async (data: Partial<TeamMember>): Promise<TeamMember> => {
    const response = await api.put('/users/profile', data);
    const updatedUser = response.data.data;
    localStorage.setItem('user', JSON.stringify(updatedUser)); // Update local storage
    return updatedUser;
  }
};
