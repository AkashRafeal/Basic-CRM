export type CallType = 'INBOUND' | 'OUTBOUND';

export type CallStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'MISSED'
  | 'CANCELLED'
  | 'BUSY'
  | 'NO_ANSWER';

export type CallPurpose =
  | 'PROSPECTING'
  | 'DISCOVERY'
  | 'PRODUCT_DEMO'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'SUPPORT'
  | 'ONBOARDING'
  | 'CHECK_IN'
  | 'CLOSING'
  | 'OTHER';

export type CallOutcome =
  | 'INTERESTED'
  | 'MEETING_BOOKED'
  | 'QUOTE_REQUESTED'
  | 'NOT_INTERESTED'
  | 'WRONG_NUMBER'
  | 'LEFT_VOICEMAIL'
  | 'CALLBACK_REQUESTED'
  | 'DEAL_CLOSED'
  | 'BUSY_NO_ANSWER'
  | 'ISSUE_RESOLVED'
  | 'OTHER';

export type RelatedEntityType = 'LEAD' | 'CUSTOMER' | 'CONTACT' | 'DEAL' | 'GENERAL';

export interface CallLog {
  id: number;
  title: string;
  callType: CallType;
  status: CallStatus;
  purpose: CallPurpose;
  outcome?: CallOutcome;
  relatedToType: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  contactName?: string;
  contactPhone?: string;
  callerPhone?: string; // Number given by user / Caller ID
  callSessionId?: string;
  telephonyProvider?: string;
  contactEmail?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  scheduledStartTime?: string;
  callStartTime?: string;
  callEndTime?: string;
  durationMinutes?: number;
  durationSeconds?: number;
  agenda?: string;
  notes?: string;
  actionItems?: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCallRequest {
  title: string;
  callType: CallType;
  status?: CallStatus;
  purpose?: CallPurpose;
  outcome?: CallOutcome;
  relatedToType?: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  contactName?: string;
  contactPhone?: string;
  callerPhone?: string; // Number given by user
  callSessionId?: string;
  telephonyProvider?: string;
  contactEmail?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  scheduledStartTime?: string;
  callStartTime?: string;
  callEndTime?: string;
  durationMinutes?: number;
  durationSeconds?: number;
  agenda?: string;
  notes?: string;
  actionItems?: string;
  recordingUrl?: string;
}

export interface UpdateCallRequest {
  title: string;
  callType: CallType;
  status?: CallStatus;
  purpose?: CallPurpose;
  outcome?: CallOutcome;
  relatedToType?: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  contactName?: string;
  contactPhone?: string;
  callerPhone?: string;
  callSessionId?: string;
  telephonyProvider?: string;
  contactEmail?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  scheduledStartTime?: string;
  callStartTime?: string;
  callEndTime?: string;
  durationMinutes?: number;
  durationSeconds?: number;
  agenda?: string;
  notes?: string;
  actionItems?: string;
  recordingUrl?: string;
}

export interface InitiateCallRequest {
  fromNumber: string; // Outbound phone number given by the user
  toNumber: string; // Customer or lead destination phone number
  customerName?: string;
  contactEmail?: string;
  purpose?: CallPurpose;
  title?: string;
  relatedToType?: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  agenda?: string;
  notes?: string;
}

export interface LogCallOutcomeRequest {
  outcome: CallOutcome;
  status?: CallStatus;
  durationMinutes?: number;
  durationSeconds?: number;
  callStartTime?: string;
  callEndTime?: string;
  notes?: string;
  actionItems?: string;
  recordingUrl?: string;
}

export interface CallStats {
  totalCalls: number;
  scheduledCalls: number;
  inProgressCalls: number;
  completedCalls: number;
  missedCalls: number;
  cancelledCalls: number;
  inboundCalls: number;
  outboundCalls: number;
  todayScheduledCalls: number;
  totalDurationMinutes: number;
  avgDurationMinutes: number;
  positiveOutcomeRate: number;
  callsByPurpose: Record<string, number>;
  callsByOutcome: Record<string, number>;
  callsByStatus: Record<string, number>;
  callsByType: Record<string, number>;
}
