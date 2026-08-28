package com.crm.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TeamLeaderboardReport {

    private int totalReps;
    private BigDecimal teamTotalRevenue;
    private BigDecimal teamActivePipeline;
    private long teamDealsWon;
    private long teamTouchpointsCompleted;
    private List<SalesLeaderboardItem> leaderboard;
}
