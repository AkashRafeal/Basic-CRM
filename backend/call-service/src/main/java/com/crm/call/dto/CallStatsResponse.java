package com.crm.call.dto;

import lombok.*;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallStatsResponse {

    private long totalCalls;
    private long scheduledCalls;
    private long inProgressCalls;
    private long completedCalls;
    private long missedCalls;
    private long cancelledCalls;
    private long inboundCalls;
    private long outboundCalls;
    private long todayScheduledCalls;
    private long totalDurationMinutes;
    private double avgDurationMinutes;
    private double positiveOutcomeRate;

    private Map<String, Long> callsByPurpose;
    private Map<String, Long> callsByOutcome;
    private Map<String, Long> callsByStatus;
    private Map<String, Long> callsByType;
}
