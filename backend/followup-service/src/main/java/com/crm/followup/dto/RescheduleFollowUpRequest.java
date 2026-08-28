package com.crm.followup.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleFollowUpRequest {

    @NotNull(message = "New scheduled date & time is required")
    private LocalDateTime scheduledAt;

    private String notes;
}
