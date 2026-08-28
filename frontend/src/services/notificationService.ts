import api from '../api/client';

export interface NotificationItem {
  id: number;
  recipientId: number;
  recipientEmail?: string;
  recipientName?: string;
  title: string;
  message: string;
  type: 'MEETING_SCHEDULED' | 'MEETING_RESCHEDULED' | 'MEETING_CANCELLED' | 'MEETING_REMINDER' | 'TASK_REMINDER' | 'GENERAL';
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
  appointmentId?: number;
  meetingLink?: string;
  meetingStartTime?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
  timeAgo?: string;
}

export interface UpcomingMeetingReminder {
  id: number;
  title: string;
  meetingType: string;
  meetingMode: string;
  meetingLink?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  attendeeName: string;
  attendeeEmail: string;
  organizerName: string;
  status: string;
}

export const notificationService = {
  async getNotifications(unreadOnly: boolean = false): Promise<NotificationItem[]> {
    const res = await api.get<{ success: boolean; data: NotificationItem[] }>(
      `/notifications${unreadOnly ? '?unreadOnly=true' : ''}`
    );
    return res.data.data || [];
  },

  async getUnreadCount(): Promise<number> {
    const res = await api.get<{ success: boolean; data: { unreadCount: number } }>(
      '/notifications/unread-count'
    );
    return res.data.data?.unreadCount || 0;
  },

  async markAsRead(id: number): Promise<NotificationItem> {
    const res = await api.patch<{ success: boolean; data: NotificationItem }>(
      `/notifications/${id}/read`
    );
    return res.data.data;
  },

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async deleteNotification(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },

  async getUpcomingReminders(): Promise<UpcomingMeetingReminder[]> {
    const res = await api.get<{ success: boolean; data: UpcomingMeetingReminder[] }>(
      '/notifications/reminders/upcoming'
    );
    return res.data.data || [];
  },

  async triggerInstantReminder(appointmentId: number): Promise<NotificationItem> {
    const res = await api.post<{ success: boolean; data: NotificationItem }>(
      `/notifications/reminders/send/${appointmentId}`
    );
    return res.data.data;
  },
};
