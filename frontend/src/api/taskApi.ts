import api from './client';
import { ApiResponse } from '../types/auth';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority, TaskType, RelatedEntityType, TaskStats } from '../types/task';

export const taskApi = {
  getTasks: async (params?: {
    search?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    taskType?: TaskType;
    assignedId?: number;
    relatedType?: RelatedEntityType;
  }): Promise<ApiResponse<Task[]>> => {
    const response = await api.get<ApiResponse<Task[]>>('/tasks', { params });
    return response.data;
  },

  getMyTasks: async (): Promise<ApiResponse<Task[]>> => {
    const response = await api.get<ApiResponse<Task[]>>('/tasks/my-tasks');
    return response.data;
  },

  getTaskById: async (id: number): Promise<ApiResponse<Task>> => {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<TaskStats>> => {
    const response = await api.get<ApiResponse<TaskStats>>('/tasks/stats');
    return response.data;
  },

  createTask: async (data: CreateTaskRequest): Promise<ApiResponse<Task>> => {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data;
  },

  updateTask: async (id: number, data: UpdateTaskRequest): Promise<ApiResponse<Task>> => {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data;
  },

  updateTaskStatus: async (id: number, status: TaskStatus): Promise<ApiResponse<Task>> => {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    return response.data;
  },

  assignTask: async (id: number, assignedToUserId: number, assignedToUserName: string): Promise<ApiResponse<Task>> => {
    const response = await api.patch<ApiResponse<Task>>(`/tasks/${id}/assign`, {
      assignedToUserId,
      assignedToUserName
    });
    return response.data;
  },

  deleteTask: async (id: number, permanent?: boolean): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/tasks/${id}`, {
      params: permanent ? { permanent: true } : undefined,
    });
    return response.data;
  }
};
