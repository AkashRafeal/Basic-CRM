import api from './client';
import {
  CallLog,
  CallType,
  CallStatus,
  CallPurpose,
  CallOutcome,
  RelatedEntityType,
  CreateCallRequest,
  UpdateCallRequest,
  LogCallOutcomeRequest,
  CallStats,
} from '../types/call';

export const callApi = {
  getCalls: async (params?: {
    search?: string;
    callType?: CallType;
    status?: CallStatus;
    purpose?: CallPurpose;
    outcome?: CallOutcome;
    relatedToType?: RelatedEntityType;
    relatedToId?: number;
    assignedToUserId?: number;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<{
    data: CallLog[];
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> => {
    const response = await api.get('/calls', { params });
    return response.data;
  },

  getCallById: async (id: number): Promise<CallLog> => {
    const response = await api.get(`/calls/${id}`);
    return response.data.data;
  },

  getStats: async (): Promise<CallStats> => {
    const response = await api.get('/calls/stats');
    return response.data.data;
  },

  getTodayScheduledCalls: async (): Promise<CallLog[]> => {
    const response = await api.get('/calls/today');
    return response.data.data;
  },

  getCallsByRelatedEntity: async (
    relatedToType: RelatedEntityType,
    relatedToId: number
  ): Promise<CallLog[]> => {
    const response = await api.get(`/calls/related/${relatedToType}/${relatedToId}`);
    return response.data.data;
  },

  createCall: async (data: CreateCallRequest): Promise<CallLog> => {
    const response = await api.post('/calls', data);
    return response.data.data;
  },

  initiateCall: async (data: import('../types/call').InitiateCallRequest): Promise<CallLog> => {
    const response = await api.post('/calls/initiate', data);
    return response.data.data;
  },

  updateCall: async (id: number, data: UpdateCallRequest): Promise<CallLog> => {
    const response = await api.put(`/calls/${id}`, data);
    return response.data.data;
  },

  logOutcome: async (id: number, data: LogCallOutcomeRequest): Promise<CallLog> => {
    const response = await api.post(`/calls/${id}/outcome`, data);
    return response.data.data;
  },

  updateStatus: async (id: number, status: CallStatus): Promise<CallLog> => {
    const response = await api.patch(`/calls/${id}/status`, null, {
      params: { status },
    });
    return response.data.data;
  },

  deleteCall: async (id: number): Promise<void> => {
    await api.delete(`/calls/${id}`);
  },
};
