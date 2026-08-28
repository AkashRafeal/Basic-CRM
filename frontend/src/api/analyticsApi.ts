import api from './client';
import { ApiResponse } from '../types/auth';
import {
  ExecutiveSummaryReport,
  SalesPerformanceReport,
  TeamLeaderboardReport,
  LeadSourceReport,
  CustomerIndustryReport
} from '../types/analytics';

export const analyticsApi = {
  getExecutiveSummary: async (): Promise<ApiResponse<ExecutiveSummaryReport>> => {
    const response = await api.get<ApiResponse<ExecutiveSummaryReport>>('/analytics/executive-summary');
    return response.data;
  },

  getSalesPerformance: async (): Promise<ApiResponse<SalesPerformanceReport>> => {
    const response = await api.get<ApiResponse<SalesPerformanceReport>>('/analytics/sales-performance');
    return response.data;
  },

  getTeamLeaderboard: async (): Promise<ApiResponse<TeamLeaderboardReport>> => {
    const response = await api.get<ApiResponse<TeamLeaderboardReport>>('/analytics/team-leaderboard');
    return response.data;
  },

  getLeadSources: async (): Promise<ApiResponse<LeadSourceReport>> => {
    const response = await api.get<ApiResponse<LeadSourceReport>>('/analytics/lead-sources');
    return response.data;
  },

  getCustomerIndustries: async (): Promise<ApiResponse<CustomerIndustryReport>> => {
    const response = await api.get<ApiResponse<CustomerIndustryReport>>('/analytics/customer-industries');
    return response.data;
  },

  getProductPerformance: async (): Promise<ApiResponse<import('../types/analytics').ProductPerformanceReport>> => {
    const response = await api.get<ApiResponse<import('../types/analytics').ProductPerformanceReport>>('/analytics/reports/products');
    return response.data;
  },

  downloadCsvReport: (type: 'deals' | 'customers' | 'leads') => {
    const token = localStorage.getItem('crm_token');
    const url = `http://localhost:8080/api/v1/analytics/export/${type}`;
    
    // Trigger browser download via fetch with auth header
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(response => response.blob())
    .then(blob => {
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `crm_${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    })
    .catch(err => console.error('Failed to download CSV:', err));
  }
};
