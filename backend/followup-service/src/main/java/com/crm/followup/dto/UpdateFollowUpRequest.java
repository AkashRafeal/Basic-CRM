package com.crm.followup.dto;

import com.crm.followup.model.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateFollowUpRequest {

    @NotBlank(message = "Follow-up title is required")
    @Size(max = 200, message = "Follow-up title must not exceed 200 characters")
    private String title;

    private FollowUpChannel channel;

    @NotNull(message = "Scheduled date & time is required")
    private LocalDateTime scheduledAt;

    private FollowUpStatus status;

    private FollowUpOutcome outcome;

    private FollowUpPriority priority;

    private String notes;

    private LocalDateTime nextFollowUpDate;

    private Long assignedToUserId;

    private String assignedToUserName;

    private TargetType targetType;

    private Long targetId;

    private String targetName;

    private Long productId;

    private String productName;
}
