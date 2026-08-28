export type DealStage = 
  | 'QUALIFICATION'
  | 'DISCOVERY'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type DealType = 
  | 'NEW_BUSINESS'
  | 'EXISTING_BUSINESS'
  | 'EXPANSION_UPSELL'
  | 'RENEWAL';

export type DealPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface DealItem {
  id?: number;
  dealId?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  discountPercentage?: number;
  totalPrice: number;
}

export interface Deal {
  id: number;
  dealName: string;
  stage: DealStage;
  stageDisplayName: string;
  amount: number;
  probability: number;
  expectedRevenue: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  dealType: DealType;
  dealTypeDisplayName: string;
  priority: DealPriority;
  priorityDisplayName: string;
  customerId?: number;
  customerName?: string;
  leadId?: number;
  assignedToUserId?: number;
  assignedToUserName?: string;
  description?: string;
  lossReason?: string;
  isWon: boolean;
  isLost: boolean;
  items?: DealItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateDealRequest {
  dealName: string;
  stage?: DealStage;
  amount: number;
  probability?: number;
  expectedCloseDate?: string;
  dealType?: DealType;
  priority?: DealPriority;
  customerId?: number;
  customerName?: string;
  leadId?: number;
  assignedToUserId?: number;
  assignedToUserName?: string;
  description?: string;
  items?: DealItem[];
}

export interface UpdateDealRequest {
  dealName: string;
  stage?: DealStage;
  amount: number;
  probability?: number;
  expectedCloseDate?: string;
  dealType?: DealType;
  priority?: DealPriority;
  customerId?: number;
  customerName?: string;
  leadId?: number;
  assignedToUserId?: number;
  assignedToUserName?: string;
  description?: string;
  lossReason?: string;
  items?: DealItem[];
}

export interface PipelineSummary {
  stage: DealStage;
  stageDisplayName: string;
  defaultProbability: number;
  count: number;
  totalValue: number;
  weightedValue: number;
  deals: Deal[];
}

export interface DealStats {
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalPipelineValue: number;
  weightedForecastValue: number;
  closedWonRevenue: number;
  winRate: number;
  averageDealSize: number;
  dealsByStage: Record<string, number>;
  valueByStage: Record<string, number>;
  dealsByType: Record<string, number>;
}

export interface PipelineStageConfig {
  id?: number;
  stage: DealStage;
  displayName: string;
  probability: number;
  stageOrder: number;
  color?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdatePipelineStageConfigRequest {
  stage: DealStage;
  displayName: string;
  probability: number;
  stageOrder?: number;
  color?: string;
  description?: string;
  isActive?: boolean;
}
