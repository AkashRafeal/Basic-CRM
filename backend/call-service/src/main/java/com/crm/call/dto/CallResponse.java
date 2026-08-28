package com.crm.call.dto;

import com.crm.call.model.*;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallResponse {

    private Long id;
    private String title;
    private CallType callType;
    private CallStatus status;
    private CallPurpose purpose;
    private CallOutcome outcome;
    private RelatedEntityType relatedToType;
    private Long relatedToId;
    private String relatedToName;
    private String contactName;
    private String contactPhone;
    private String callerPhone;
    private String callSessionId;
    private String telephonyProvider;
    private String contactEmail;
    private Long assignedToUserId;
    private String assignedToUserName;
    private LocalDateTime scheduledStartTime;
    private LocalDateTime callStartTime;
    private LocalDateTime callEndTime;
    private Integer durationMinutes;
    private Integer durationSeconds;
    private String agenda;
    private String notes;
    private String actionItems;
    private String recordingUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CallResponse fromEntity(CallLog entity) {
        if (entity == null) return null;
        return CallResponse.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .callType(entity.getCallType())
                .status(entity.getStatus())
                .purpose(entity.getPurpose())
                .outcome(entity.getOutcome())
                .relatedToType(entity.getRelatedToType())
                .relatedToId(entity.getRelatedToId())
                .relatedToName(entity.getRelatedToName())
                .contactName(entity.getContactName())
                .contactPhone(entity.getContactPhone())
                .callerPhone(entity.getCallerPhone())
                .callSessionId(entity.getCallSessionId())
                .telephonyProvider(entity.getTelephonyProvider())
                .contactEmail(entity.getContactEmail())
                .assignedToUserId(entity.getAssignedToUserId())
                .assignedToUserName(entity.getAssignedToUserName())
                .scheduledStartTime(entity.getScheduledStartTime())
                .callStartTime(entity.getCallStartTime())
                .callEndTime(entity.getCallEndTime())
                .durationMinutes(entity.getDurationMinutes())
                .durationSeconds(entity.getDurationSeconds())
                .agenda(entity.getAgenda())
                .notes(entity.getNotes())
                .actionItems(entity.getActionItems())
                .recordingUrl(entity.getRecordingUrl())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
