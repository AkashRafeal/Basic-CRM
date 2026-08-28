package com.crm.task.dto;

import com.crm.task.model.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskResponse {

    private Long id;
    private String title;
    private String description;
    private TaskType taskType;
    private String taskTypeDisplayName;
    private TaskPriority priority;
    private String priorityDisplayName;
    private TaskStatus status;
    private String statusDisplayName;
    private LocalDate dueDate;
    private LocalDateTime completedAt;
    private Long assignedToUserId;
    private String assignedToUserName;
    private RelatedEntityType relatedEntityType;
    private String relatedEntityDisplayName;
    private Long relatedEntityId;
    private String relatedEntityName;
    private Long productId;
    private String productName;
    private Long createdByUserId;
    private String createdByUserName;
    private String createdByRole;
    private Boolean isDeleted;
    private boolean isOverdue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static TaskResponse fromEntity(Task task) {
        if (task == null) return null;

        boolean overdue = false;
        if (task.getDueDate() != null && 
            (task.getStatus() == TaskStatus.TODO || task.getStatus() == TaskStatus.IN_PROGRESS)) {
            overdue = task.getDueDate().isBefore(LocalDate.now());
        }

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .taskType(task.getTaskType())
                .taskTypeDisplayName(task.getTaskType() != null ? task.getTaskType().getDisplayName() : null)
                .priority(task.getPriority())
                .priorityDisplayName(task.getPriority() != null ? task.getPriority().getDisplayName() : null)
                .status(task.getStatus())
                .statusDisplayName(task.getStatus() != null ? task.getStatus().getDisplayName() : null)
                .dueDate(task.getDueDate())
                .completedAt(task.getCompletedAt())
                .assignedToUserId(task.getAssignedToUserId())
                .assignedToUserName(task.getAssignedToUserName())
                .relatedEntityType(task.getRelatedEntityType())
                .relatedEntityDisplayName(task.getRelatedEntityType() != null ? task.getRelatedEntityType().getDisplayName() : null)
                .relatedEntityId(task.getRelatedEntityId())
                .relatedEntityName(task.getRelatedEntityName())
                .productId(task.getProductId())
                .productName(task.getProductName())
                .createdByUserId(task.getCreatedByUserId())
                .createdByUserName(task.getCreatedByUserName())
                .createdByRole(task.getCreatedByRole())
                .isDeleted(task.getIsDeleted())
                .isOverdue(overdue)
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
