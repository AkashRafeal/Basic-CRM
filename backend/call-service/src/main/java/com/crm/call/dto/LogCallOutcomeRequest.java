package com.crm.call.dto;

import com.crm.call.model.CallOutcome;
import com.crm.call.model.CallStatus;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogCallOutcomeRequest {

    @NotNull(message = "Call outcome is required")
    private CallOutcome outcome;

    private CallStatus status;

    private Integer durationMinutes;

    private Integer durationSeconds;

    private LocalDateTime callStartTime;

    private LocalDateTime callEndTime;

    private String notes;

    private String actionItems;

    private String recordingUrl;
}
