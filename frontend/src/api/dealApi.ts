import api from './client';
import { ApiResponse } from '../types/auth';
import {
  Deal,
  CreateDealRequest,
  UpdateDealRequest,
  DealStage,
  DealType,
  DealPriority,
  PipelineSummary,
  DealStats
} from '../types/deal';

export const dealApi = {
  getDeals: async (params?: {
    search?: string;
    stage?: DealStage;
    dealType?: DealType;
    priority?: DealPriority;
    assignedId?: number;
  }): Promise<ApiResponse<Deal[]>> => {
    const response = await api.get<ApiResponse<Deal[]>>('/deals', { params });
    return response.data;
  },

  getPipelineSummary: async (): Promise<ApiResponse<PipelineSummary[]>> => {
    const response = await api.get<ApiResponse<PipelineSummary[]>>('/deals/pipeline-summary');
    return response.data;
  },

  getStats: async (): Promise<ApiResponse<DealStats>> => {
    const response = await api.get<ApiResponse<DealStats>>('/deals/stats');
    return response.data;
  },

  getDealById: async (id: number): Promise<ApiResponse<Deal>> => {
    const response = await api.get<ApiResponse<Deal>>(`/deals/${id}`);
    return response.data;
  },

  createDeal: async (data: CreateDealRequest): Promise<ApiResponse<Deal>> => {
    const response = await api.post<ApiResponse<Deal>>('/deals', data);
    return response.data;
  },

  updateDeal: async (id: number, data: UpdateDealRequest): Promise<ApiResponse<Deal>> => {
    const response = await api.put<ApiResponse<Deal>>(`/deals/${id}`, data);
    return response.data;
  },

  updateDealStage: async (id: number, stage: DealStage, probability?: number): Promise<ApiResponse<Deal>> => {
    const response = await api.patch<ApiResponse<Deal>>(`/deals/${id}/stage`, { stage, probability });
    return response.data;
  },

  closeDealWon: async (id: number): Promise<ApiResponse<Deal>> => {
    const response = await api.patch<ApiResponse<Deal>>(`/deals/${id}/won`);
    return response.data;
  },

  closeDealLost: async (id: number, lossReason: string): Promise<ApiResponse<Deal>> => {
    const response = await api.patch<ApiResponse<Deal>>(`/deals/${id}/lost`, { lossReason });
    return response.data;
  },

  deleteDeal: async (id: number): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/deals/${id}`);
    return response.data;
  },

  getStageConfigs: async (): Promise<ApiResponse<import('../types/deal').PipelineStageConfig[]>> => {
    const response = await api.get<ApiResponse<import('../types/deal').PipelineStageConfig[]>>('/deals/stages/config');
    return response.data;
  },

  updateStageConfigs: async (
    configs: import('../types/deal').UpdatePipelineStageConfigRequest[]
  ): Promise<ApiResponse<import('../types/deal').PipelineStageConfig[]>> => {
    const response = await api.put<ApiResponse<import('../types/deal').PipelineStageConfig[]>>('/deals/stages/config', configs);
    return response.data;
  },

  updateStageConfig: async (
    stage: DealStage,
    config: import('../types/deal').UpdatePipelineStageConfigRequest
  ): Promise<ApiResponse<import('../types/deal').PipelineStageConfig>> => {
    const response = await api.put<ApiResponse<import('../types/deal').PipelineStageConfig>>(`/deals/stages/config/${stage}`, config);
    return response.data;
  },

  getDealProducts: async (id: number): Promise<ApiResponse<import('../types/deal').DealItem[]>> => {
    const response = await api.get<ApiResponse<import('../types/deal').DealItem[]>>(`/deals/${id}/products`);
    return response.data;
  },
};
