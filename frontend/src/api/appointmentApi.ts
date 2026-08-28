import axios from 'axios';
import {
  Appointment,
  AppointmentStats,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  ReschedulePayload,
  CompletePayload,
  EntityType,
  AppointmentStatus,
  MeetingType,
  MeetingMode,
} from '../types/appointment';

const API_BASE = '/api/v1/appointments';

const getAuthHeaders = () => {
  const token = localStorage.getItem('crm_token') || localStorage.getItem('token');
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
  };
};

export const appointmentApi = {
  getAppointments: async (params?: {
    entityType?: EntityType;
    entityId?: number;
    status?: AppointmentStatus;
    meetingType?: MeetingType;
    meetingMode?: MeetingMode;
    startDate?: string;
    endDate?: string;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<{ data: Appointment[]; totalItems: number; totalPages: number; currentPage: number }> => {
    const res = await axios.get(API_BASE, {
      ...getAuthHeaders(),
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
        ...params,
      },
    });
    return res.data;
  },

  getCalendarRange: async (start: string, end: string): Promise<Appointment[]> => {
    const res = await axios.get(`${API_BASE}/calendar`, {
      ...getAuthHeaders(),
      params: { start, end },
    });
    return res.data?.data || [];
  },

  getAppointmentById: async (id: number): Promise<Appointment> => {
    const res = await axios.get(`${API_BASE}/${id}`, getAuthHeaders());
    return res.data?.data;
  },

  createAppointment: async (payload: CreateAppointmentPayload): Promise<Appointment> => {
    const res = await axios.post(API_BASE, payload, getAuthHeaders());
    return res.data?.data;
  },

  updateAppointment: async (id: number, payload: UpdateAppointmentPayload): Promise<Appointment> => {
    const res = await axios.put(`${API_BASE}/${id}`, payload, getAuthHeaders());
    return res.data?.data;
  },

  rescheduleAppointment: async (id: number, payload: ReschedulePayload): Promise<Appointment> => {
    const res = await axios.patch(`${API_BASE}/${id}/reschedule`, payload, getAuthHeaders());
    return res.data?.data;
  },

  completeAppointment: async (id: number, payload: CompletePayload): Promise<Appointment> => {
    const res = await axios.patch(`${API_BASE}/${id}/complete`, payload, getAuthHeaders());
    return res.data?.data;
  },

  cancelAppointment: async (id: number, reason: string): Promise<Appointment> => {
    const res = await axios.patch(
      `${API_BASE}/${id}/cancel`,
      {},
      {
        ...getAuthHeaders(),
        params: { reason },
      }
    );
    return res.data?.data;
  },

  deleteAppointment: async (id: number): Promise<void> => {
    await axios.delete(`${API_BASE}/${id}`, getAuthHeaders());
  },

  getStats: async (): Promise<AppointmentStats> => {
    const res = await axios.get(`${API_BASE}/stats`, getAuthHeaders());
    return res.data?.data;
  },

  getIntegrationConfig: async (): Promise<import('../types/appointment').IntegrationConfig> => {
    const res = await axios.get(`${API_BASE}/integrations`, getAuthHeaders());
    return res.data?.data;
  },

  updateIntegrationConfig: async (
    payload: import('../types/appointment').UpdateIntegrationPayload
  ): Promise<import('../types/appointment').IntegrationConfig> => {
    const res = await axios.put(`${API_BASE}/integrations`, payload, getAuthHeaders());
    return res.data?.data;
  },

  // Export & Import
  exportCsv: async (params?: {
    entityType?: EntityType;
    entityId?: number;
    status?: AppointmentStatus;
    meetingType?: MeetingType;
    meetingMode?: MeetingMode;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<string> => {
    const res = await axios.get(`${API_BASE}/export/csv`, {
      ...getAuthHeaders(),
      params,
      responseType: 'text',
    });
    return res.data;
  },

  exportIcs: async (params?: {
    entityType?: EntityType;
    entityId?: number;
    status?: AppointmentStatus;
    meetingType?: MeetingType;
    meetingMode?: MeetingMode;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<string> => {
    const res = await axios.get(`${API_BASE}/export/ics`, {
      ...getAuthHeaders(),
      params,
      responseType: 'text',
    });
    return res.data;
  },

  exportSingleIcs: async (id: number): Promise<string> => {
    const res = await axios.get(`${API_BASE}/${id}/export/ics`, {
      ...getAuthHeaders(),
      responseType: 'text',
    });
    return res.data;
  },

  getImportTemplate: async (): Promise<string> => {
    const res = await axios.get(`${API_BASE}/import/template`, {
      ...getAuthHeaders(),
      responseType: 'text',
    });
    return res.data;
  },

  importCsv: async (csvContent: string): Promise<import('../types/appointment').ImportResultResponse> => {
    const res = await axios.post(
      `${API_BASE}/import/csv`,
      { csvContent },
      getAuthHeaders()
    );
    return res.data?.data;
  },
};
