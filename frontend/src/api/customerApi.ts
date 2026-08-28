import api from './client';
import { ApiResponse } from '../types/auth';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest, CustomerStatus, CustomerTier, Industry, CustomerStats } from '../types/customer';

export const customerApi = {
  getCustomers: async (params?: {
    search?: string;
    status?: CustomerStatus;
    tier?: CustomerTier;
    industry?: Industry;
    assignedId?: number;
    isDeleted?: boolean;
  }): Promise<ApiResponse<Customer[]>> => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return response.data;
  },

  getCustomerById: async (id: number): Promise<ApiResponse<Customer>> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<CustomerStats>> => {
    const response = await api.get<ApiResponse<CustomerStats>>('/customers/stats');
    return response.data;
  },

  createCustomer: async (data: CreateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: number, data: UpdateCustomerRequest): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },

  updateCustomerStatus: async (id: number, customerStatus: CustomerStatus): Promise<ApiResponse<Customer>> => {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}/status`, { customerStatus });
    return response.data;
  },

  assignAccountManager: async (id: number, assignedAccountManagerId: number, assignedAccountManagerName: string): Promise<ApiResponse<Customer>> => {
    const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}/assign`, {
      assignedAccountManagerId,
      assignedAccountManagerName
    });
    return response.data;
  },

  deleteCustomer: async (id: number, reason?: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/customers/${id}`, {
      params: { reason }
    });
    return response.data;
  },

  restoreCustomer: async (id: number): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>(`/customers/${id}/restore`);
    return response.data;
  },

  permanentlyDeleteCustomer: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/customers/${id}/permanent`);
    return response.data;
  },

  getCustomerProducts: async (id: number): Promise<ApiResponse<import('../types/customer').CustomerProduct[]>> => {
    const response = await api.get<ApiResponse<import('../types/customer').CustomerProduct[]>>(`/customers/${id}/products`);
    return response.data;
  },

  assignCustomerProduct: async (
    id: number,
    data: {
      productId: number;
      productName?: string;
      quantity?: number;
      unitPrice?: number;
      totalAmount?: number;
      status?: string;
      startDate?: string;
      expiryDate?: string;
      billingFrequency?: string;
    }
  ): Promise<ApiResponse<import('../types/customer').CustomerProduct>> => {
    const response = await api.post<ApiResponse<import('../types/customer').CustomerProduct>>(`/customers/${id}/products`, data);
    return response.data;
  },

  deleteCustomerProduct: async (id: number, productId: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/customers/${id}/products/${productId}`);
    return response.data;
  }
};
