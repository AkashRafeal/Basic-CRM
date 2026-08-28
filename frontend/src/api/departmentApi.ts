import api from './client';
import { ApiResponse, Department, DepartmentHierarchy } from '../types/auth';

export const departmentApi = {
  getAllDepartments: async (): Promise<Department[]> => {
    const res = await api.get<ApiResponse<Department[]>>('/departments');
    return res.data.data;
  },

  createDepartment: async (payload: { name: string; code?: string; description?: string }): Promise<Department> => {
    const res = await api.post<ApiResponse<Department>>('/departments', payload);
    return res.data.data;
  },

  getHierarchy: async (): Promise<DepartmentHierarchy[]> => {
    const res = await api.get<ApiResponse<DepartmentHierarchy[]>>('/departments/hierarchy');
    return res.data.data;
  },

  deleteDepartment: async (id: number): Promise<void> => {
    await api.delete<ApiResponse<void>>(`/departments/${id}`);
  },
};
