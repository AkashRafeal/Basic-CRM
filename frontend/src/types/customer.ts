export type CustomerStatus = 'ACTIVE' | 'ONBOARDING' | 'AT_RISK' | 'CHURNED' | 'INACTIVE';

export type CustomerTier = 'TIER_1_ENTERPRISE' | 'TIER_2_MID_MARKET' | 'TIER_3_SMB' | 'STRATEGIC';

export type Industry = 
  | 'TECHNOLOGY'
  | 'FINANCE'
  | 'HEALTHCARE'
  | 'MANUFACTURING'
  | 'RETAIL'
  | 'EDUCATION'
  | 'SERVICES'
  | 'OTHER';

export interface CustomerProduct {
  id: number;
  customerId: number;
  productId: number;
  productName: string;
  dealId?: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string; // ACTIVE, EXPIRED, CANCELLED
  purchaseDate: string;
  startDate?: string;
  expiryDate?: string;
  billingFrequency?: string;
}

export interface Customer {
  id: number;
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry: Industry;
  industryDisplayName: string;
  customerTier: CustomerTier;
  tierDisplayName: string;
  customerStatus: CustomerStatus;
  statusDisplayName: string;
  annualRevenue: number;
  billingAddress?: string;
  notes?: string;
  assignedAccountManagerId?: number;
  assignedAccountManagerName?: string;
  convertedFromLeadId?: number;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedByUserId?: number;
  deletedByUserName?: string;
  deletedByRole?: string;
  deleteRequested?: boolean;
  deleteRequestReason?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdByRole?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateCustomerRequest {
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry?: Industry;
  customerTier?: CustomerTier;
  customerStatus?: CustomerStatus;
  annualRevenue?: number;
  billingAddress?: string;
  notes?: string;
  assignedAccountManagerId?: number;
  assignedAccountManagerName?: string;
  convertedFromLeadId?: number;
  createdByUserId?: number;
  createdByUserName?: string;
  createdByRole?: string;
}

export interface UpdateCustomerRequest {
  name: string;
  contactPerson?: string;
  email: string;
  phone?: string;
  company?: string;
  website?: string;
  industry?: Industry;
  customerTier?: CustomerTier;
  customerStatus?: CustomerStatus;
  annualRevenue?: number;
  billingAddress?: string;
  notes?: string;
  assignedAccountManagerId?: number;
  assignedAccountManagerName?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  onboardingCustomers: number;
  atRiskCustomers: number;
  churnedCustomers: number;
  trashCustomersCount?: number;
  totalAnnualRevenue: number;
  activeAnnualRevenue: number;
  retentionRate: number;
  customersByTier: Record<string, number>;
  customersByIndustry: Record<string, number>;
  customersByStatus: Record<string, number>;
}
