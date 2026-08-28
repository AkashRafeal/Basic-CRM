package com.crm.appointment.dto;

import com.crm.appointment.model.Notification;
import com.crm.appointment.model.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Duration;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

    private Long id;
    private Long recipientId;
    private String recipientEmail;
    private String recipientName;
    private String title;
    private String message;
    private NotificationType type;
    private String priority;
    private Long appointmentId;
    private String meetingLink;
    private LocalDateTime meetingStartTime;
    @com.fasterxml.jackson.annotation.JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime createdAt;
    private String timeAgo;

    public static NotificationResponse fromEntity(Notification entity) {
        if (entity == null) return null;

        String timeAgo = calculateTimeAgo(entity.getCreatedAt());

        return NotificationResponse.builder()
                .id(entity.getId())
                .recipientId(entity.getRecipientId())
                .recipientEmail(entity.getRecipientEmail())
                .recipientName(entity.getRecipientName())
                .title(entity.getTitle())
                .message(entity.getMessage())
                .type(entity.getType())
                .priority(entity.getPriority())
                .appointmentId(entity.getAppointmentId())
                .meetingLink(entity.getMeetingLink())
                .meetingStartTime(entity.getMeetingStartTime())
                .isRead(entity.isRead())
                .createdAt(entity.getCreatedAt())
                .timeAgo(timeAgo)
                .build();
    }

    private static String calculateTimeAgo(LocalDateTime dateTime) {
        if (dateTime == null) return "Just now";
        Duration duration = Duration.between(dateTime, LocalDateTime.now());
        long seconds = duration.getSeconds();

        if (seconds < 60) return "Just now";
        long minutes = seconds / 60;
        if (minutes < 60) return minutes + "m ago";
        long hours = minutes / 60;
        if (hours < 24) return hours + "h ago";
        long days = hours / 24;
        return days + "d ago";
    }
}
