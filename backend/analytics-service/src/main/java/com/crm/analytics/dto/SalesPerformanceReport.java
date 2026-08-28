package com.crm.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SalesPerformanceReport {

    private BigDecimal totalPipelineValue;
    private BigDecimal weightedForecastValue;
    private BigDecimal closedWonRevenue;
    private BigDecimal closedLostValue;
    private BigDecimal averageDealSize;
    private double winRate;
    private long totalDeals;
    private long wonDeals;
    private long lostDeals;
    private long activeDeals;
    private Map<String, Long> dealsByStage;
    private Map<String, BigDecimal> revenueByStage;
    private Map<String, Long> dealsByType;
    private Map<String, BigDecimal> revenueByType;
    private Map<String, Long> lossReasonsPareto;
}
