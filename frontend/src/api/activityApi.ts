import axios from 'axios';
import {
  Note,
  ActivityLog,
  ActivityStats,
  CreateNotePayload,
  UpdateNotePayload,
  CreateActivityPayload,
  EntityType,
  ActivityType,
} from '../types/activity';

const API_BASE = '/api/v1';

const getAuthHeaders = () => {
  const token = localStorage.getItem('crm_token') || localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const activityApi = {
  // Notes API
  getNotes: async (params?: {
    entityType?: EntityType;
    entityId?: number;
    pinnedOnly?: boolean;
    search?: string;
  }): Promise<Note[]> => {
    const res = await axios.get(`${API_BASE}/notes`, {
      ...getAuthHeaders(),
      params,
    });
    return res.data?.data || [];
  },

  getNoteById: async (id: number): Promise<Note> => {
    const res = await axios.get(`${API_BASE}/notes/${id}`, getAuthHeaders());
    return res.data?.data;
  },

  createNote: async (payload: CreateNotePayload): Promise<Note> => {
    const res = await axios.post(`${API_BASE}/notes`, payload, getAuthHeaders());
    return res.data?.data;
  },

  updateNote: async (id: number, payload: UpdateNotePayload): Promise<Note> => {
    const res = await axios.put(`${API_BASE}/notes/${id}`, payload, getAuthHeaders());
    return res.data?.data;
  },

  togglePin: async (id: number): Promise<Note> => {
    const res = await axios.patch(`${API_BASE}/notes/${id}/pin`, {}, getAuthHeaders());
    return res.data?.data;
  },

  deleteNote: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/notes/${id}`, getAuthHeaders());
  },

  // Activities API
  getActivities: async (params?: {
    entityType?: EntityType;
    entityId?: number;
    activityType?: ActivityType;
    actorId?: number;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<{ data: ActivityLog[]; totalItems: number; totalPages: number; currentPage: number }> => {
    const res = await axios.get(`${API_BASE}/activities`, {
      ...getAuthHeaders(),
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
        ...params,
      },
    });
    return res.data;
  },

  getEntityTimeline: async (entityType: EntityType, entityId: number): Promise<ActivityLog[]> => {
    const res = await axios.get(
      `${API_BASE}/activities/timeline/${entityType}/${entityId}`,
      getAuthHeaders()
    );
    return res.data?.data || [];
  },

  logActivity: async (payload: CreateActivityPayload): Promise<ActivityLog> => {
    const res = await axios.post(`${API_BASE}/activities`, payload, getAuthHeaders());
    return res.data?.data;
  },

  getStats: async (): Promise<ActivityStats> => {
    const res = await axios.get(`${API_BASE}/activities/stats`, getAuthHeaders());
    return res.data?.data;
  },
};
