export type EntityType =
  | 'LEAD'
  | 'CUSTOMER'
  | 'DEAL'
  | 'CONTACT'
  | 'PRODUCT'
  | 'TASK'
  | 'FOLLOWUP'
  | 'COMMUNICATION'
  | 'GENERAL';

export type ActivityType =
  | 'NOTE_CREATED'
  | 'NOTE_UPDATED'
  | 'CALL_LOGGED'
  | 'EMAIL_SENT'
  | 'SMS_SENT'
  | 'MEETING_SCHEDULED'
  | 'STAGE_CHANGED'
  | 'STATUS_CHANGED'
  | 'DEAL_WON'
  | 'LEAD_CONVERTED'
  | 'TASK_COMPLETED'
  | 'FOLLOWUP_LOGGED'
  | 'STOCK_ADJUSTED'
  | 'CUSTOM_ACTIVITY';

export type NoteVisibility = 'PUBLIC_TEAM' | 'MANAGERS_ONLY' | 'PRIVATE_OWNER';

export interface Note {
  id: number;
  title: string;
  content: string;
  entityType: EntityType;
  entityId?: number;
  entityTitle?: string;
  isPinned: boolean;
  colorTag: 'blue' | 'green' | 'purple' | 'amber' | 'rose' | 'indigo' | string;
  visibility: NoteVisibility;
  tags?: string;
  authorId: number;
  authorName: string;
  authorRole: string;
  authorEmail?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: number;
  activityType: ActivityType;
  title: string;
  description?: string;
  entityType?: EntityType;
  entityId?: number;
  entityTitle?: string;
  metadataJson?: string;
  actorId: number;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export interface ActivityStats {
  totalActivities: number;
  totalNotes: number;
  pinnedNotes: number;
  todayActivities: number;
  activitiesByType: Record<string, number>;
  notesByEntity: Record<string, number>;
}

export interface CreateNotePayload {
  title: string;
  content: string;
  entityType: EntityType;
  entityId?: number;
  entityTitle?: string;
  isPinned?: boolean;
  colorTag?: string;
  visibility?: NoteVisibility;
  tags?: string;
}

export interface UpdateNotePayload {
  title: string;
  content: string;
  isPinned?: boolean;
  colorTag?: string;
  visibility?: NoteVisibility;
  tags?: string;
}

export interface CreateActivityPayload {
  activityType: ActivityType;
  title: string;
  description?: string;
  entityType?: EntityType;
  entityId?: number;
  entityTitle?: string;
  metadataJson?: string;
}
