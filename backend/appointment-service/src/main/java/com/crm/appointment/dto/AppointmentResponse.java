package com.crm.appointment.dto;

import com.crm.appointment.model.Appointment;
import com.crm.appointment.model.AppointmentStatus;
import com.crm.appointment.model.EntityType;
import com.crm.appointment.model.MeetingMode;
import com.crm.appointment.model.MeetingType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private String title;
    private String description;
    private MeetingType meetingType;
    private AppointmentStatus status;
    private MeetingMode meetingMode;
    private String meetingLink;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private String timeZone;

    private EntityType entityType;
    private Long entityId;
    private String entityTitle;

    private Long organizerId;
    private String organizerName;
    private String organizerEmail;
    private String organizerRole;
    private Long organizerDepartmentId;

    private String attendeeName;
    private String attendeeEmail;
    private String attendeePhone;
    private String externalGuests;

    private String outcomeNotes;
    private String actionItems;
    private String cancellationReason;
    private String recordingUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AppointmentResponse fromEntity(Appointment a) {
        return AppointmentResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .description(a.getDescription())
                .meetingType(a.getMeetingType())
                .status(a.getStatus())
                .meetingMode(a.getMeetingMode())
                .meetingLink(a.getMeetingLink())
                .location(a.getLocation())
                .startTime(a.getStartTime())
                .endTime(a.getEndTime())
                .durationMinutes(a.getDurationMinutes())
                .timeZone(a.getTimeZone())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .entityTitle(a.getEntityTitle())
                .organizerId(a.getOrganizerId())
                .organizerName(a.getOrganizerName())
                .organizerEmail(a.getOrganizerEmail())
                .organizerRole(a.getOrganizerRole())
                .organizerDepartmentId(a.getOrganizerDepartmentId())
                .attendeeName(a.getAttendeeName())
                .attendeeEmail(a.getAttendeeEmail())
                .attendeePhone(a.getAttendeePhone())
                .externalGuests(a.getExternalGuests())
                .outcomeNotes(a.getOutcomeNotes())
                .actionItems(a.getActionItems())
                .cancellationReason(a.getCancellationReason())
                .recordingUrl(a.getRecordingUrl())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
