package com.crm.pipeline.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealStatsResponse {

    private long totalDeals;
    private long activeDeals;
    private long wonDeals;
    private long lostDeals;
    private BigDecimal totalPipelineValue;
    private BigDecimal weightedForecastValue;
    private BigDecimal closedWonRevenue;
    private double winRate;
    private BigDecimal averageDealSize;
    private Map<String, Long> dealsByStage;
    private Map<String, BigDecimal> valueByStage;
    private Map<String, Long> dealsByType;
}
