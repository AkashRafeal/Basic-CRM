package com.crm.followup.dto;

import com.crm.followup.model.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpResponse {

    private Long id;
    private String title;
    private FollowUpChannel channel;
    private String channelDisplayName;
    private LocalDateTime scheduledAt;
    private LocalDateTime completedAt;
    private FollowUpStatus status;
    private String statusDisplayName;
    private FollowUpOutcome outcome;
    private String outcomeDisplayName;
    private FollowUpPriority priority;
    private String priorityDisplayName;
    private String notes;
    private LocalDateTime nextFollowUpDate;
    private Long assignedToUserId;
    private String assignedToUserName;
    private TargetType targetType;
    private String targetTypeDisplayName;
    private Long targetId;
    private String targetName;
    private Long productId;
    private String productName;
    private Long createdByUserId;
    private String createdByUserName;
    private String createdByRole;
    private Boolean isDeleted;
    private boolean isOverdue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static FollowUpResponse fromEntity(FollowUp followUp) {
        if (followUp == null) return null;

        boolean overdue = false;
        if (followUp.getScheduledAt() != null && followUp.getStatus() == FollowUpStatus.SCHEDULED) {
            overdue = followUp.getScheduledAt().isBefore(LocalDateTime.now());
        }

        return FollowUpResponse.builder()
                .id(followUp.getId())
                .title(followUp.getTitle())
                .channel(followUp.getChannel())
                .channelDisplayName(followUp.getChannel() != null ? followUp.getChannel().getDisplayName() : null)
                .scheduledAt(followUp.getScheduledAt())
                .completedAt(followUp.getCompletedAt())
                .status(followUp.getStatus())
                .statusDisplayName(followUp.getStatus() != null ? followUp.getStatus().getDisplayName() : null)
                .outcome(followUp.getOutcome())
                .outcomeDisplayName(followUp.getOutcome() != null ? followUp.getOutcome().getDisplayName() : null)
                .priority(followUp.getPriority())
                .priorityDisplayName(followUp.getPriority() != null ? followUp.getPriority().getDisplayName() : null)
                .notes(followUp.getNotes())
                .nextFollowUpDate(followUp.getNextFollowUpDate())
                .assignedToUserId(followUp.getAssignedToUserId())
                .assignedToUserName(followUp.getAssignedToUserName())
                .targetType(followUp.getTargetType())
                .targetTypeDisplayName(followUp.getTargetType() != null ? followUp.getTargetType().getDisplayName() : null)
                .targetId(followUp.getTargetId())
                .targetName(followUp.getTargetName())
                .productId(followUp.getProductId())
                .productName(followUp.getProductName())
                .createdByUserId(followUp.getCreatedByUserId())
                .createdByUserName(followUp.getCreatedByUserName())
                .createdByRole(followUp.getCreatedByRole())
                .isDeleted(followUp.getIsDeleted())
                .isOverdue(overdue)
                .createdAt(followUp.getCreatedAt())
                .updatedAt(followUp.getUpdatedAt())
                .build();
    }
}
