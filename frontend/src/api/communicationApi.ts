import api from './client';
import {
  CommunicationLog,
  CreateCommunicationRequest,
  SendMessageRequest,
  UpdateCommunicationRequest,
  CommunicationStats,
  CommunicationChannel,
  CommunicationDirection,
  MessageStatus,
  RelatedEntityType,
} from '../types/communication';

export const communicationApi = {
  getCommunications: async (params?: {
    query?: string;
    channel?: CommunicationChannel;
    direction?: CommunicationDirection;
    status?: MessageStatus;
    relatedToType?: RelatedEntityType;
    isStarred?: boolean;
    isRead?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }) => {
    const response = await api.get<{
      success: boolean;
      data: CommunicationLog[];
      currentPage: number;
      totalItems: number;
      totalPages: number;
    }>('/communications', { params });
    return response.data;
  },

  getCommunicationById: async (id: number) => {
    const response = await api.get<{ success: boolean; data: CommunicationLog }>(
      `/communications/${id}`
    );
    return response.data;
  },

  getThreadMessages: async (threadId: string) => {
    const response = await api.get<{ success: boolean; data: CommunicationLog[] }>(
      `/communications/thread/${threadId}`
    );
    return response.data;
  },

  getCommunicationsByRelatedEntity: async (type: RelatedEntityType, id: number) => {
    const response = await api.get<{ success: boolean; data: CommunicationLog[] }>(
      `/communications/related/${type}/${id}`
    );
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<{ success: boolean; data: CommunicationStats }>(
      '/communications/stats'
    );
    return response.data;
  },

  createCommunication: async (data: CreateCommunicationRequest) => {
    const response = await api.post<{ success: boolean; data: CommunicationLog }>(
      '/communications',
      data
    );
    return response.data;
  },

  sendMessage: async (data: SendMessageRequest) => {
    const response = await api.post<{ success: boolean; data: CommunicationLog }>(
      '/communications/send',
      data
    );
    return response.data;
  },

  updateCommunication: async (id: number, data: UpdateCommunicationRequest) => {
    const response = await api.put<{ success: boolean; data: CommunicationLog }>(
      `/communications/${id}`,
      data
    );
    return response.data;
  },

  toggleStar: async (id: number) => {
    const response = await api.patch<{ success: boolean; data: CommunicationLog }>(
      `/communications/${id}/star`
    );
    return response.data;
  },

  markRead: async (id: number, isRead: boolean = true) => {
    const response = await api.patch<{ success: boolean; data: CommunicationLog }>(
      `/communications/${id}/read`,
      null,
      { params: { isRead } }
    );
    return response.data;
  },

  deleteCommunication: async (id: number) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/communications/${id}`
    );
    return response.data;
  },

  downloadCsvReport: async () => {
    const response = await api.get('/communications/export', {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'crm_communication_logs.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  getGatewayConfigs: async () => {
    const response = await api.get<{ success: boolean; data: any }>(
      '/communications/gateways/config'
    );
    return response.data;
  },

  updateGatewayConfigs: async (data: any) => {
    const response = await api.put<{ success: boolean; data: any }>(
      '/communications/gateways/config',
      data
    );
    return response.data;
  },
};

