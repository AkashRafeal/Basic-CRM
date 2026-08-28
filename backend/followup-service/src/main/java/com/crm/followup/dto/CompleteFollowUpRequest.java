package com.crm.followup.dto;

import com.crm.followup.model.FollowUpOutcome;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompleteFollowUpRequest {

    @NotNull(message = "Interaction outcome is required")
    private FollowUpOutcome outcome;

    private String notes;

    private LocalDateTime nextFollowUpDate;
}
