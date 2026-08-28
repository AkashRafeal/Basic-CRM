package com.crm.task.dto;

import com.crm.task.model.RelatedEntityType;
import com.crm.task.model.TaskPriority;
import com.crm.task.model.TaskStatus;
import com.crm.task.model.TaskType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateTaskRequest {

    @NotBlank(message = "Task title is required")
    @Size(max = 200, message = "Task title must not exceed 200 characters")
    private String title;

    private String description;

    private TaskType taskType;

    private TaskPriority priority;

    private TaskStatus status;

    private LocalDate dueDate;

    private Long assignedToUserId;

    private String assignedToUserName;

    private RelatedEntityType relatedEntityType;

    private Long relatedEntityId;

    private String relatedEntityName;

    private Long productId;

    private String productName;
}
