export type MeetingType =
  | 'DISCOVERY_CALL'
  | 'PRODUCT_DEMO'
  | 'PROPOSAL_REVIEW'
  | 'NEGOTIATION'
  | 'EXECUTIVE_SPONSOR'
  | 'ONBOARDING'
  | 'ACCOUNT_REVIEW'
  | 'CUSTOM';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type MeetingMode =
  | 'VIRTUAL_ZOOM'
  | 'VIRTUAL_GOOGLE_MEET'
  | 'VIRTUAL_MS_TEAMS'
  | 'IN_PERSON_OFFICE'
  | 'CLIENT_SITE'
  | 'PHONE_CALL';

export type EntityType =
  | 'LEAD'
  | 'CUSTOMER'
  | 'DEAL'
  | 'CONTACT'
  | 'PRODUCT'
  | 'GENERAL';

export interface Appointment {
  id: number;
  title: string;
  description?: string;
  meetingType: MeetingType;
  status: AppointmentStatus;
  meetingMode: MeetingMode;
  meetingLink?: string;
  location?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  timeZone: string;

  entityType?: EntityType;
  entityId?: number;
  entityTitle?: string;

  organizerId: number;
  organizerName: string;
  organizerEmail?: string;
  organizerRole: string;
  organizerDepartmentId?: number;

  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  externalGuests?: string;

  outcomeNotes?: string;
  actionItems?: string;
  cancellationReason?: string;
  recordingUrl?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentStats {
  totalAppointments: number;
  scheduledUpcoming: number;
  completedCount: number;
  todayAppointments: number;
  cancelledCount: number;
  noShowCount: number;
  showUpRatePercent: number;
  countByType: Record<string, number>;
  countByMode: Record<string, number>;
  countByStatus: Record<string, number>;
}

export interface CreateAppointmentPayload {
  title: string;
  description?: string;
  meetingType: MeetingType;
  meetingMode: MeetingMode;
  meetingLink?: string;
  location?: string;
  startTime: string;
  endTime?: string;
  durationMinutes?: number;
  timeZone?: string;
  entityType?: EntityType;
  entityId?: number;
  entityTitle?: string;
  organizerId?: number;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone?: string;
  externalGuests?: string;
}

export interface UpdateAppointmentPayload {
  title?: string;
  description?: string;
  meetingType?: MeetingType;
  status?: AppointmentStatus;
  meetingMode?: MeetingMode;
  meetingLink?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  timeZone?: string;
  entityType?: EntityType;
  entityId?: number;
  entityTitle?: string;
  attendeeName?: string;
  attendeeEmail?: string;
  attendeePhone?: string;
  externalGuests?: string;
  outcomeNotes?: string;
  actionItems?: string;
  cancellationReason?: string;
  recordingUrl?: string;
}

export interface ReschedulePayload {
  newStartTime: string;
  newEndTime?: string;
  newDurationMinutes?: number;
  reason?: string;
}

export interface CompletePayload {
  outcomeNotes?: string;
  actionItems?: string;
  recordingUrl?: string;
  isNoShow?: boolean;
}

export interface IntegrationConfig {
  id: number;
  providerKey: string;
  googleMeetEnabled: boolean;
  googleWorkspaceDomain?: string;
  zoomEnabled: boolean;
  zoomAccountId?: string;
  zoomClientId?: string;
  msTeamsEnabled: boolean;
  msTeamsTenantId?: string;
  autoSyncCalendar: boolean;
  webhookUrl?: string;
  updatedAt?: string;
}

export interface UpdateIntegrationPayload {
  googleMeetEnabled: boolean;
  googleWorkspaceDomain?: string;
  zoomEnabled: boolean;
  zoomAccountId?: string;
  zoomClientId?: string;
  msTeamsEnabled: boolean;
  msTeamsTenantId?: string;
  autoSyncCalendar: boolean;
  webhookUrl?: string;
}

export interface ImportRowError {
  rowNumber: number;
  rowData: string;
  errorMessage: string;
}

export interface ImportResultResponse {
  totalRows: number;
  successCount: number;
  failureCount: number;
  errors: ImportRowError[];
  createdAppointments: Appointment[];
}
