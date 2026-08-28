package com.crm.lead.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignLeadRequest {

    @NotNull(message = "Assigned user ID is required")
    private Long assignedToUserId;

    @NotBlank(message = "Assigned user name is required")
    private String assignedToUserName;
}
