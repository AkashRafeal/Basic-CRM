export type ContactType =
  | 'DECISION_MAKER'
  | 'CHAMPION'
  | 'INFLUENCER'
  | 'TECHNICAL_EVALUATOR'
  | 'EXECUTIVE_SPONSOR'
  | 'BILLING_CONTACT'
  | 'END_USER'
  | 'OTHER';

export type ContactStatus = 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'FORMER_EMPLOYEE';

export interface StakeholderTag {
  id: number;
  name: string;
  color: string;
  description?: string;
  createdAt?: string;
}

export interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  customerId?: number;
  customerName?: string;
  contactType: ContactType;
  status: ContactStatus;
  isPrimaryContact: boolean;
  doNotCall: boolean;
  doNotEmail: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  tags?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedByUserId?: number;
  archivedByUserName?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdByRole?: string;
  notes?: string;
  lastContactedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  customerId?: number;
  customerName?: string;
  contactType?: ContactType;
  status?: ContactStatus;
  isPrimaryContact?: boolean;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  tags?: string;
  notes?: string;
  lastContactedDate?: string;
}

export interface UpdateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  customerId?: number;
  customerName?: string;
  contactType?: ContactType;
  status?: ContactStatus;
  isPrimaryContact?: boolean;
  doNotCall?: boolean;
  doNotEmail?: boolean;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  linkedinUrl?: string;
  twitterHandle?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  tags?: string;
  notes?: string;
  lastContactedDate?: string;
}

export interface RelinkContactRequest {
  customerId: number;
  customerName?: string;
}

export interface MergeContactsRequest {
  primaryContactId: number;
  duplicateContactId: number;
}

export interface CreateTagRequest {
  name: string;
  color?: string;
  description?: string;
}

export interface ContactStats {
  totalContacts: number;
  activeContacts: number;
  primaryContacts: number;
  decisionMakers: number;
  champions: number;
  accountsCovered: number;
  archivedContacts: number;
  contactsByType: Record<string, number>;
  contactsByStatus: Record<string, number>;
}
