import api from './client';
import { 
  ApiResponse, 
  Role, 
  User, 
  CreateUserPayload, 
  UpdateUserPayload, 
  ChangePasswordPayload, 
  AdminResetPasswordPayload 
} from '../types/auth';

export const userApi = {
  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const res = await api.post<ApiResponse<User>>('/users', payload);
    return res.data.data;
  },

  getAllUsers: async (params?: { search?: string; role?: Role; active?: boolean }): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/users', { params });
    return res.data.data;
  },

  getTeamMembers: async (): Promise<User[]> => {
    const res = await api.get<ApiResponse<User[]>>('/users/team-members');
    return res.data.data;
  },

  getUserById: async (id: number): Promise<User> => {
    const res = await api.get<ApiResponse<User>>(`/users/${id}`);
    return res.data.data;
  },

  updateUser: async (id: number, payload: UpdateUserPayload): Promise<User> => {
    const res = await api.put<ApiResponse<User>>(`/users/${id}`, payload);
    return res.data.data;
  },

  updateUserRole: async (id: number, role: Role): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return res.data.data;
  },

  toggleUserStatus: async (id: number): Promise<User> => {
    const res = await api.patch<ApiResponse<User>>(`/users/${id}/toggle-status`);
    return res.data.data;
  },

  changePassword: async (id: number, payload: ChangePasswordPayload): Promise<void> => {
    await api.put<ApiResponse<void>>(`/users/${id}/change-password`, payload);
  },

  adminResetPassword: async (id: number, payload: AdminResetPasswordPayload): Promise<void> => {
    await api.put<ApiResponse<void>>(`/users/${id}/admin-reset-password`, payload);
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/users/${id}`);
  },
};
