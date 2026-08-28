package com.crm.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignTaskRequest {

    @NotNull(message = "Assigned user ID is required")
    private Long assignedToUserId;

    @NotBlank(message = "Assigned user name is required")
    private String assignedToUserName;
}
