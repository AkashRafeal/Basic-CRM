package com.crm.appointment.service;

import com.crm.appointment.dto.AppointmentResponse;
import com.crm.appointment.dto.NotificationResponse;
import com.crm.appointment.model.Appointment;
import com.crm.appointment.model.AppointmentStatus;
import com.crm.appointment.model.Notification;
import com.crm.appointment.model.NotificationType;
import com.crm.appointment.repository.AppointmentRepository;
import com.crm.appointment.repository.NotificationRepository;
import com.crm.appointment.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final AppointmentRepository appointmentRepository;

    @Transactional
    public Notification createNotification(
            Long recipientId,
            String recipientEmail,
            String recipientName,
            String title,
            String message,
            NotificationType type,
            String priority,
            Long appointmentId,
            String meetingLink,
            LocalDateTime meetingStartTime) {

        Notification notification = Notification.builder()
                .recipientId(recipientId)
                .recipientEmail(recipientEmail)
                .recipientName(recipientName)
                .title(title)
                .message(message)
                .type(type != null ? type : NotificationType.GENERAL)
                .priority(priority != null ? priority : "MEDIUM")
                .appointmentId(appointmentId)
                .meetingLink(meetingLink)
                .meetingStartTime(meetingStartTime)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created Notification ID {} ({}) for User ID {}", saved.getId(), saved.getType(), recipientId);
        return saved;
    }

    @Transactional
    public void deleteNotificationsForAppointment(Long appointmentId) {
        if (appointmentId == null) return;
        try {
            notificationRepository.deleteByAppointmentId(appointmentId);
            log.info("Auto-deleted notifications for closed/over appointment ID {}", appointmentId);
        } catch (Exception e) {
            log.warn("Failed to delete notifications for appointment ID {}: {}", appointmentId, e.getMessage());
        }
    }

    @Transactional
    public void autoCleanOverOrClosedMeetingNotifications(Long userId) {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<Notification> list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
            for (Notification n : list) {
                if (n.getAppointmentId() != null) {
                    java.util.Optional<Appointment> apptOpt = appointmentRepository.findById(n.getAppointmentId());
                    if (apptOpt.isEmpty()) {
                        // Appointment was deleted, remove notification
                        notificationRepository.delete(n);
                    } else {
                        Appointment a = apptOpt.get();
                        if (a.getStatus() == AppointmentStatus.COMPLETED ||
                            a.getStatus() == AppointmentStatus.CANCELLED ||
                            a.getStatus() == AppointmentStatus.NO_SHOW ||
                            (a.getEndTime() != null && a.getEndTime().isBefore(now))) {
                            notificationRepository.delete(n);
                            log.info("Auto-cleaned notification ID {} for concluded appointment ID {}", n.getId(), a.getId());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Auto cleanup of meeting notifications failed: {}", e.getMessage());
        }
    }

    @Transactional
    public List<NotificationResponse> getUserNotifications(
            UserPrincipal principal,
            Boolean unreadOnly,
            NotificationType type,
            String priority,
            String search) {
        Long userId = principal != null && principal.getId() != null ? principal.getId() : 1L;

        // Auto-clean any notifications whose meetings are completed, cancelled, or in the past
        autoCleanOverOrClosedMeetingNotifications(userId);

        List<Notification> list = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);

        return list.stream()
                .filter(n -> {
                    if (Boolean.TRUE.equals(unreadOnly) && n.isRead()) return false;
                    if (type != null && n.getType() != type) return false;
                    if (priority != null && !priority.equalsIgnoreCase("ALL") && !priority.equalsIgnoreCase(n.getPriority())) return false;
                    if (search != null && !search.isBlank()) {
                        String s = search.toLowerCase();
                        boolean matchTitle = n.getTitle() != null && n.getTitle().toLowerCase().contains(s);
                        boolean matchMsg = n.getMessage() != null && n.getMessage().toLowerCase().contains(s);
                        boolean matchName = n.getRecipientName() != null && n.getRecipientName().toLowerCase().contains(s);
                        if (!matchTitle && !matchMsg && !matchName) return false;
                    }
                    return true;
                })
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public long getUnreadCount(UserPrincipal principal) {
        Long userId = principal != null && principal.getId() != null ? principal.getId() : 1L;
        autoCleanOverOrClosedMeetingNotifications(userId);
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, UserPrincipal principal) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

        if (principal != null && !principal.isAdmin() && !notification.getRecipientId().equals(principal.getId())) {
            throw new AccessDeniedException("Access denied: You can only view your own notifications");
        }

        notification.setRead(true);
        Notification saved = notificationRepository.save(notification);
        return NotificationResponse.fromEntity(saved);
    }

    @Transactional
    public void markAllAsRead(UserPrincipal principal) {
        Long userId = principal != null && principal.getId() != null ? principal.getId() : 1L;
        notificationRepository.markAllAsReadForUser(userId);
        log.info("Marked all notifications as read for User ID {}", userId);
    }

    @Transactional
    public void deleteNotification(Long id, UserPrincipal principal) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found with ID: " + id));

        if (principal != null && !principal.isAdmin() && !notification.getRecipientId().equals(principal.getId())) {
            throw new AccessDeniedException("Access denied: You can only delete your own notifications");
        }

        notificationRepository.delete(notification);
        log.info("Deleted Notification ID {}", id);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getUpcomingReminders(UserPrincipal principal) {
        Long userId = principal != null && principal.getId() != null ? principal.getId() : 1L;
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime next24Hours = now.plusHours(24);

        List<Appointment> list;
        if (principal != null && principal.isAdmin()) {
            list = appointmentRepository.findByStartTimeBetweenOrderByStartTimeAsc(now, next24Hours);
        } else if (principal != null && principal.isManager() && principal.getDepartmentId() != null) {
            list = appointmentRepository.findByOrganizerDepartmentIdAndStartTimeBetweenOrderByStartTimeAsc(
                    principal.getDepartmentId(), now, next24Hours);
        } else {
            list = appointmentRepository.findByOrganizerIdAndStartTimeBetweenOrderByStartTimeAsc(
                    userId, now, next24Hours);
        }

        return list.stream()
                .filter(a -> a.getStatus() == AppointmentStatus.SCHEDULED ||
                             a.getStatus() == AppointmentStatus.CONFIRMED ||
                             a.getStatus() == AppointmentStatus.RESCHEDULED)
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationResponse triggerInstantReminder(Long appointmentId, UserPrincipal principal) {
        Appointment appt = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + appointmentId));

        if (principal != null && !principal.isAdmin() && !principal.isManager() && !appt.getOrganizerId().equals(principal.getId())) {
            throw new AccessDeniedException("Access denied: You can only send reminders for your own appointments");
        }

        String title = "⏰ Reminder: " + appt.getTitle() + " Starting Soon";
        String message = String.format("Meeting with %s (%s) is scheduled for %s. Virtual room: %s",
                appt.getAttendeeName(),
                appt.getAttendeeEmail(),
                appt.getStartTime(),
                appt.getMeetingLink() != null ? appt.getMeetingLink() : (appt.getLocation() != null ? appt.getLocation() : "TBD"));

        Notification notification = createNotification(
                appt.getOrganizerId(),
                appt.getOrganizerEmail(),
                appt.getOrganizerName(),
                title,
                message,
                NotificationType.MEETING_REMINDER,
                "HIGH",
                appt.getId(),
                appt.getMeetingLink(),
                appt.getStartTime()
        );

        log.info("Sent Instant Meeting Reminder for Appointment ID {} to Host {} ({}) and Attendee {}",
                appointmentId, appt.getOrganizerName(), appt.getOrganizerEmail(), appt.getAttendeeEmail());

        return NotificationResponse.fromEntity(notification);
    }
}
