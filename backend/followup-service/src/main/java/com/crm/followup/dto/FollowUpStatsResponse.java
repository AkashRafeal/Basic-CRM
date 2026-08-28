package com.crm.followup.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FollowUpStatsResponse {

    private long totalFollowUps;
    private long scheduledToday;
    private long totalScheduled;
    private long totalCompleted;
    private long totalMissed;
    private long positiveOutcomes;
    private double successRate;
    private Map<String, Long> followUpsByChannel;
    private Map<String, Long> followUpsByStatus;
    private Map<String, Long> followUpsByOutcome;
}
