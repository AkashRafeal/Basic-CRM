export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATING'
  | 'CONVERTED'
  | 'LOST';

export type LeadSource =
  | 'WEBSITE'
  | 'REFERRAL'
  | 'COLD_CALL'
  | 'EMAIL_CAMPAIGN'
  | 'SOCIAL_MEDIA'
  | 'EVENT'
  | 'OTHER';

export interface LeadProductDTO {
  productId: number;
  name: string;
  sku?: string;
  category?: string;
  unitPrice?: number;
  status?: string;
  isPhysical?: boolean;
}

export interface Lead {
  id: number;
  firstName: string;
  lastName?: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadStatus: LeadStatus;
  statusDisplayName: string;
  leadSource: LeadSource;
  sourceDisplayName: string;
  estimatedValue?: number;
  score?: number;
  notes?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  convertedCustomerId?: number;
  convertedDealId?: number;
  convertedAt?: string;
  isArchived?: boolean;
  interestedProductIds?: number[];
  interestedProducts?: LeadProductDTO[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateLeadRequest {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadStatus?: LeadStatus;
  leadSource?: LeadSource;
  estimatedValue?: number;
  score?: number;
  notes?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  interestedProductIds?: number[];
}

export interface UpdateLeadRequest {
  firstName: string;
  lastName?: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  leadStatus?: LeadStatus;
  leadSource?: LeadSource;
  estimatedValue?: number;
  score?: number;
  notes?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  interestedProductIds?: number[];
}

export interface LeadStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  lostLeads: number;
  conversionRate: number;
  totalPipelineValue: number;
  statusBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
}
