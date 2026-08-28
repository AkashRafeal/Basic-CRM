package com.crm.call.dto;

import com.crm.call.model.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCallRequest {

    @NotBlank(message = "Call title or subject is required")
    private String title;

    @NotNull(message = "Call type is required")
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
}
