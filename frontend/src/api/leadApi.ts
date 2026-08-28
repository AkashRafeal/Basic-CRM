import api from './client';
import { ApiResponse } from '../types/auth';
import { Lead, CreateLeadRequest, UpdateLeadRequest, LeadStatus, LeadSource, LeadStats } from '../types/lead';

export const leadApi = {
  getLeads: async (params?: {
    search?: string;
    status?: LeadStatus;
    source?: LeadSource;
    assignedUserId?: number;
  }): Promise<ApiResponse<Lead[]>> => {
    const response = await api.get<ApiResponse<Lead[]>>('/leads', { params });
    return response.data;
  },

  getLeadById: async (id: number): Promise<ApiResponse<Lead>> => {
    const response = await api.get<ApiResponse<Lead>>(`/leads/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<LeadStats>> => {
    const response = await api.get<ApiResponse<LeadStats>>('/leads/stats');
    return response.data;
  },

  createLead: async (data: CreateLeadRequest): Promise<ApiResponse<Lead>> => {
    const response = await api.post<ApiResponse<Lead>>('/leads', data);
    return response.data;
  },

  updateLead: async (id: number, data: UpdateLeadRequest): Promise<ApiResponse<Lead>> => {
    const response = await api.put<ApiResponse<Lead>>(`/leads/${id}`, data);
    return response.data;
  },

  updateLeadStatus: async (id: number, leadStatus: LeadStatus): Promise<ApiResponse<Lead>> => {
    const response = await api.patch<ApiResponse<Lead>>(`/leads/${id}/status`, { leadStatus });
    return response.data;
  },

  assignLead: async (id: number, assignedToUserId: number, assignedToUserName: string): Promise<ApiResponse<Lead>> => {
    const response = await api.patch<ApiResponse<Lead>>(`/leads/${id}/assign`, {
      assignedToUserId,
      assignedToUserName
    });
    return response.data;
  },

  convertLead: async (id: number): Promise<ApiResponse<Lead>> => {
    const response = await api.post<ApiResponse<Lead>>(`/leads/${id}/convert`);
    return response.data;
  },

  deleteLead: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/leads/${id}`);
    return response.data;
  },

  getLeadProducts: async (id: number): Promise<ApiResponse<any[]>> => {
    const response = await api.get<ApiResponse<any[]>>(`/leads/${id}/products`);
    return response.data;
  }
};
