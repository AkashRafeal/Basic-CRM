export type FollowUpChannel = 
  | 'PHONE_CALL'
  | 'EMAIL'
  | 'VIDEO_CONFERENCE'
  | 'IN_PERSON_MEETING'
  | 'WHATSAPP_SMS'
  | 'LINKEDIN_MESSAGE'
  | 'OTHER';

export type FollowUpStatus = 
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'MISSED'
  | 'RESCHEDULED'
  | 'CANCELLED';

export type FollowUpOutcome = 
  | 'PENDING'
  | 'INTERESTED'
  | 'PROPOSAL_REQUESTED'
  | 'MEETING_BOOKED'
  | 'CALLBACK_REQUESTED'
  | 'NOT_INTERESTED'
  | 'NO_ANSWER'
  | 'DEAL_WON'
  | 'DEAL_LOST';

export type TargetType = 'LEAD' | 'CUSTOMER' | 'CONTACT';

export type FollowUpPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface FollowUp {
  id: number;
  title: string;
  channel: FollowUpChannel;
  channelDisplayName: string;
  scheduledAt: string;
  completedAt?: string;
  status: FollowUpStatus;
  statusDisplayName: string;
  outcome: FollowUpOutcome;
  outcomeDisplayName: string;
  priority: FollowUpPriority;
  priorityDisplayName: string;
  notes?: string;
  nextFollowUpDate?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  targetType: TargetType;
  targetTypeDisplayName: string;
  targetId?: number;
  targetName?: string;
  productId?: number;
  productName?: string;
  createdByUserId?: number;
  createdByUserName?: string;
  createdByRole?: string;
  isDeleted?: boolean;
  isOverdue: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFollowUpRequest {
  title: string;
  channel?: FollowUpChannel;
  scheduledAt: string;
  priority?: FollowUpPriority;
  notes?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  targetType?: TargetType;
  targetId?: number;
  targetName?: string;
  productId?: number;
  productName?: string;
}

export interface UpdateFollowUpRequest {
  title: string;
  channel?: FollowUpChannel;
  scheduledAt: string;
  status?: FollowUpStatus;
  outcome?: FollowUpOutcome;
  priority?: FollowUpPriority;
  notes?: string;
  nextFollowUpDate?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  targetType?: TargetType;
  targetId?: number;
  targetName?: string;
  productId?: number;
  productName?: string;
}

export interface CompleteFollowUpRequest {
  outcome: FollowUpOutcome;
  notes?: string;
  nextFollowUpDate?: string;
}

export interface RescheduleFollowUpRequest {
  scheduledAt: string;
  notes?: string;
}

export interface FollowUpStats {
  totalFollowUps: number;
  scheduledToday: number;
  totalScheduled: number;
  totalCompleted: number;
  totalMissed: number;
  positiveOutcomes: number;
  successRate: number;
  followUpsByChannel: Record<string, number>;
  followUpsByStatus: Record<string, number>;
  followUpsByOutcome: Record<string, number>;
}

export interface FollowUpCadenceConfig {
  id?: number;
  cadenceName: string;
  initialTouchpointHours: number;
  secondTouchpointDays: number;
  thirdTouchpointDays: number;
  maxAttemptsBeforeDormant: number;
  autoEscalateOverdueHours: number;
  enableSmsReminders: boolean;
  enableEmailCadence: boolean;
  updatedAt?: string;
}

export interface UpdateCadenceConfigRequest {
  cadenceName?: string;
  initialTouchpointHours?: number;
  secondTouchpointDays?: number;
  thirdTouchpointDays?: number;
  maxAttemptsBeforeDormant?: number;
  autoEscalateOverdueHours?: number;
  enableSmsReminders?: boolean;
  enableEmailCadence?: boolean;
}

