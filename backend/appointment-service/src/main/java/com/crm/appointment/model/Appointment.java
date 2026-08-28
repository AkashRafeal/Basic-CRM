package com.crm.appointment.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointments", indexes = {
    @Index(name = "idx_appt_start", columnList = "start_time"),
    @Index(name = "idx_appt_organizer", columnList = "organizer_id"),
    @Index(name = "idx_appt_dept", columnList = "organizer_department_id"),
    @Index(name = "idx_appt_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_appt_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "meeting_type", nullable = false, length = 50)
    @Builder.Default
    private MeetingType meetingType = MeetingType.PRODUCT_DEMO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(name = "meeting_mode", nullable = false, length = 50)
    @Builder.Default
    private MeetingMode meetingMode = MeetingMode.VIRTUAL_GOOGLE_MEET;

    @Column(name = "meeting_link", length = 500)
    private String meetingLink; // e.g. https://meet.google.com/abc-xyz or Zoom link

    @Column(length = 255)
    private String location; // Physical address or room

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 30;

    @Column(name = "time_zone", length = 50)
    @Builder.Default
    private String timeZone = "Asia/Kolkata";

    // Entity Linkage
    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", length = 50)
    private EntityType entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_title", length = 255)
    private String entityTitle;

    // Organizer / Host
    @Column(name = "organizer_id", nullable = false)
    private Long organizerId;

    @Column(name = "organizer_name", nullable = false, length = 150)
    private String organizerName;

    @Column(name = "organizer_email", length = 150)
    private String organizerEmail;

    @Column(name = "organizer_role", length = 50)
    private String organizerRole;

    @Column(name = "organizer_department_id")
    private Long organizerDepartmentId;

    // Attendee / Client Info
    @Column(name = "attendee_name", nullable = false, length = 150)
    private String attendeeName;

    @Column(name = "attendee_email", nullable = false, length = 150)
    private String attendeeEmail;

    @Column(name = "attendee_phone", length = 20)
    private String attendeePhone; // 10-digit phone

    @Column(name = "external_guests", columnDefinition = "TEXT")
    private String externalGuests; // Comma-separated emails

    // Meeting Outcome & Wrap-up
    @Column(name = "outcome_notes", columnDefinition = "TEXT")
    private String outcomeNotes;

    @Column(name = "action_items", columnDefinition = "TEXT")
    private String actionItems;

    @Column(name = "cancellation_reason", length = 500)
    private String cancellationReason;

    @Column(name = "recording_url", length = 500)
    private String recordingUrl;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
