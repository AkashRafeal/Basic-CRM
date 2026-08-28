import api from './client';
import { ApiResponse } from '../types/auth';
import {
  FollowUp,
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  CompleteFollowUpRequest,
  RescheduleFollowUpRequest,
  FollowUpChannel,
  FollowUpStatus,
  FollowUpOutcome,
  FollowUpPriority,
  TargetType,
  FollowUpStats
} from '../types/followup';

export const followupApi = {
  getFollowUps: async (params?: {
    search?: string;
    status?: FollowUpStatus;
    channel?: FollowUpChannel;
    outcome?: FollowUpOutcome;
    priority?: FollowUpPriority;
    assignedId?: number;
    targetType?: TargetType;
  }): Promise<ApiResponse<FollowUp[]>> => {
    const response = await api.get<ApiResponse<FollowUp[]>>('/followups', { params });
    return response.data;
  },

  getMySchedule: async (): Promise<ApiResponse<FollowUp[]>> => {
    const response = await api.get<ApiResponse<FollowUp[]>>('/followups/my-schedule');
    return response.data;
  },

  getFollowUpById: async (id: number): Promise<ApiResponse<FollowUp>> => {
    const response = await api.get<ApiResponse<FollowUp>>(`/followups/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<FollowUpStats>> => {
    const response = await api.get<ApiResponse<FollowUpStats>>('/followups/stats');
    return response.data;
  },

  createFollowUp: async (data: CreateFollowUpRequest): Promise<ApiResponse<FollowUp>> => {
    const response = await api.post<ApiResponse<FollowUp>>('/followups', data);
    return response.data;
  },

  updateFollowUp: async (id: number, data: UpdateFollowUpRequest): Promise<ApiResponse<FollowUp>> => {
    const response = await api.put<ApiResponse<FollowUp>>(`/followups/${id}`, data);
    return response.data;
  },

  completeFollowUp: async (id: number, data: CompleteFollowUpRequest): Promise<ApiResponse<FollowUp>> => {
    const response = await api.patch<ApiResponse<FollowUp>>(`/followups/${id}/complete`, data);
    return response.data;
  },

  rescheduleFollowUp: async (id: number, data: RescheduleFollowUpRequest): Promise<ApiResponse<FollowUp>> => {
    const response = await api.patch<ApiResponse<FollowUp>>(`/followups/${id}/reschedule`, data);
    return response.data;
  },

  getUnassignedFollowUps: async (): Promise<ApiResponse<FollowUp[]>> => {
    const response = await api.get<ApiResponse<FollowUp[]>>('/followups/unassigned');
    return response.data;
  },

  claimFollowUp: async (id: number): Promise<ApiResponse<FollowUp>> => {
    const response = await api.patch<ApiResponse<FollowUp>>(`/followups/${id}/claim`);
    return response.data;
  },

  getCadenceConfigs: async (): Promise<ApiResponse<any>> => {
    const response = await api.get<ApiResponse<any>>('/followups/cadences/config');
    return response.data;
  },

  updateCadenceConfigs: async (data: any): Promise<ApiResponse<any>> => {
    const response = await api.put<ApiResponse<any>>('/followups/cadences/config', data);
    return response.data;
  },

  deleteFollowUp: async (id: number, permanent: boolean = false): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/followups/${id}`, {
      params: { permanent }
    });
    return response.data;
  }
};

