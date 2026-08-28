import api from './client';
import {
  Contact,
  ContactType,
  ContactStatus,
  CreateContactRequest,
  UpdateContactRequest,
  ContactStats,
  StakeholderTag,
  CreateTagRequest,
  RelinkContactRequest,
  MergeContactsRequest,
} from '../types/contact';

export const contactApi = {
  getContacts: async (params?: {
    search?: string;
    customerId?: number;
    assignedId?: number;
    contactType?: ContactType;
    status?: ContactStatus;
    isPrimary?: boolean;
    isArchived?: boolean;
    page?: number;
    size?: number;
    sortBy?: string;
    sortDir?: string;
  }): Promise<{
    data: Contact[];
    currentPage: number;
    totalItems: number;
    totalPages: number;
  }> => {
    const response = await api.get('/contacts', { params });
    return response.data;
  },

  getContactById: async (id: number): Promise<Contact> => {
    const response = await api.get(`/contacts/${id}`);
    return response.data.data;
  },

  getContactsByCustomer: async (customerId: number): Promise<Contact[]> => {
    const response = await api.get(`/contacts/customer/${customerId}`);
    return response.data.data;
  },

  getStats: async (): Promise<ContactStats> => {
    const response = await api.get('/contacts/stats');
    return response.data.data;
  },

  createContact: async (data: CreateContactRequest): Promise<Contact> => {
    const response = await api.post('/contacts', data);
    return response.data.data;
  },

  updateContact: async (id: number, data: UpdateContactRequest): Promise<Contact> => {
    const response = await api.put(`/contacts/${id}`, data);
    return response.data.data;
  },

  relinkContact: async (id: number, data: RelinkContactRequest): Promise<Contact> => {
    const response = await api.patch(`/contacts/${id}/relink`, data);
    return response.data.data;
  },

  togglePrimary: async (id: number, isPrimary: boolean): Promise<Contact> => {
    const response = await api.patch(`/contacts/${id}/primary`, null, {
      params: { isPrimary },
    });
    return response.data.data;
  },

  archiveContact: async (id: number): Promise<Contact> => {
    const response = await api.patch(`/contacts/${id}/archive`);
    return response.data.data;
  },

  restoreContact: async (id: number): Promise<Contact> => {
    const response = await api.post(`/contacts/${id}/restore`);
    return response.data.data;
  },

  permanentDeleteContact: async (id: number): Promise<void> => {
    await api.delete(`/contacts/${id}/permanent`);
  },

  mergeContacts: async (data: MergeContactsRequest): Promise<Contact> => {
    const response = await api.post('/contacts/merge', data);
    return response.data.data;
  },

  getAllTags: async (): Promise<StakeholderTag[]> => {
    const response = await api.get('/contacts/tags');
    return response.data.data;
  },

  createTag: async (data: CreateTagRequest): Promise<StakeholderTag> => {
    const response = await api.post('/contacts/tags', data);
    return response.data.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await api.delete(`/contacts/tags/${id}`);
  },
};
