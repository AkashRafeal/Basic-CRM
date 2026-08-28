package com.crm.appointment.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RescheduleRequest {

    @NotNull(message = "New start time is required")
    private LocalDateTime newStartTime;

    private LocalDateTime newEndTime;

    private Integer newDurationMinutes;

    private String reason;
}
