package com.crm.call.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_call_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CallType callType = CallType.OUTBOUND;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CallStatus status = CallStatus.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private CallPurpose purpose = CallPurpose.DISCOVERY;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private CallOutcome outcome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private RelatedEntityType relatedToType = RelatedEntityType.GENERAL;

    @Column(name = "related_to_id")
    private Long relatedToId;

    @Column(length = 200)
    private String relatedToName;

    @Column(length = 150)
    private String contactName;

    @Column(length = 50)
    private String contactPhone;

    @Column(length = 50)
    private String callerPhone; // Outbound phone number given by the user / caller ID

    @Column(length = 100)
    private String callSessionId; // Session ID from telephony bridge

    @Column(length = 50)
    @Builder.Default
    private String telephonyProvider = "CRM_VIRTUAL_DIALER";

    @Column(length = 150)
    private String contactEmail;

    private Long assignedToUserId;

    @Column(length = 150)
    private String assignedToUserName;

    private LocalDateTime scheduledStartTime;

    private LocalDateTime callStartTime;

    private LocalDateTime callEndTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(columnDefinition = "TEXT")
    private String agenda;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String actionItems;

    @Column(length = 500)
    private String recordingUrl;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
