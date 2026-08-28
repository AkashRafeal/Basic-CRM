export type CommunicationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'WHATSAPP'
  | 'CHAT'
  | 'VIDEO_CALL'
  | 'LINKEDIN'
  | 'PORTAL_NOTE';

export type CommunicationDirection = 'OUTGOING' | 'INCOMING';

export type MessageStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'RECEIVED'
  | 'ARCHIVED';

export type PriorityLevel = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type RelatedEntityType =
  | 'LEAD'
  | 'CUSTOMER'
  | 'CONTACT'
  | 'DEAL'
  | 'SUPPORT'
  | 'GENERAL';

export interface CommunicationLog {
  id: number;
  threadId?: string;
  channel: CommunicationChannel;
  direction: CommunicationDirection;
  status: MessageStatus;
  priority: PriorityLevel;
  subject: string;
  body: string;
  snippet?: string;
  recipientName?: string;
  recipientAddress?: string;
  senderName?: string;
  senderAddress?: string;
  relatedToType: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  isStarred?: boolean;
  isRead?: boolean;
  openCount?: number;
  clickCount?: number;
  attachmentNames?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommunicationRequest {
  threadId?: string;
  channel: CommunicationChannel;
  direction?: CommunicationDirection;
  status?: MessageStatus;
  priority?: PriorityLevel;
  subject: string;
  body: string;
  snippet?: string;
  recipientName?: string;
  recipientAddress?: string;
  senderName?: string;
  senderAddress?: string;
  relatedToType?: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  isStarred?: boolean;
  isRead?: boolean;
  attachmentNames?: string;
  scheduledAt?: string;
  sentAt?: string;
}

export interface SendMessageRequest {
  channel: CommunicationChannel;
  recipientAddress: string;
  recipientName?: string;
  subject: string;
  body: string;
  priority?: PriorityLevel;
  relatedToType?: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  threadId?: string;
  attachmentNames?: string;
}

export interface UpdateCommunicationRequest {
  threadId?: string;
  channel?: CommunicationChannel;
  direction?: CommunicationDirection;
  status?: MessageStatus;
  priority?: PriorityLevel;
  subject: string;
  body: string;
  snippet?: string;
  recipientName?: string;
  recipientAddress?: string;
  senderName?: string;
  senderAddress?: string;
  relatedToType?: RelatedEntityType;
  relatedToId?: number;
  relatedToName?: string;
  assignedToUserId?: number;
  assignedToUserName?: string;
  isStarred?: boolean;
  isRead?: boolean;
  openCount?: number;
  clickCount?: number;
  attachmentNames?: string;
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface CommunicationStats {
  totalMessages: number;
  outgoingMessages: number;
  incomingMessages: number;
  deliveredMessages: number;
  readMessages: number;
  unreadMessages: number;
  scheduledMessages: number;
  starredMessages: number;
  deliveredRate: number;
  readRate: number;
  messagesByChannel: Record<string, number>;
  messagesByStatus: Record<string, number>;
  messagesByDirection: Record<string, number>;
}

export interface CommunicationGatewayConfig {
  id?: number;
  smtpEnabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpFromName: string;
  smsEnabled: boolean;
  twilioAccountSid: string;
  twilioSenderNumber: string;
  whatsappEnabled: boolean;
  whatsappPhoneNumberId: string;
  whatsappBusinessAccountId: string;
  webhookUrl: string;
  updatedAt?: string;
}

export interface UpdateGatewayConfigRequest {
  smtpEnabled?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUsername?: string;
  smtpFromName?: string;
  smsEnabled?: boolean;
  twilioAccountSid?: string;
  twilioSenderNumber?: string;
  whatsappEnabled?: boolean;
  whatsappPhoneNumberId?: string;
  whatsappBusinessAccountId?: string;
  webhookUrl?: string;
}

