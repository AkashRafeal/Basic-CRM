package com.crm.analytics.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesLeaderboardItem {

    private Long userId;
    private String userName;
    private String userEmail;
    private String role;
    private int rank;
    private BigDecimal closedWonRevenue;
    private BigDecimal activePipelineValue;
    private long dealsWon;
    private long activeDeals;
    private long touchpointsCompleted;
    private long tasksCompleted;
    private double taskCompletionRate;
}
