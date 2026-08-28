package com.crm.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExecutiveSummaryReport {

    private LocalDateTime generatedAt;
    private BigDecimal totalPipelineValue;
    private BigDecimal weightedForecastValue;
    private BigDecimal recognizedCustomerArr;
    private BigDecimal totalProspectLeadValue;
    private long totalDeals;
    private long activeDeals;
    private long wonDeals;
    private double winRate;
    private long totalCustomers;
    private long activeCustomers;
    private long totalLeads;
    private double leadConversionRate;
    private long totalTasks;
    private long overdueTasks;
    private double taskCompletionRate;
    private long followUpsToday;
    private double followUpSuccessRate;
    private List<SalesLeaderboardItem> topPerformers;
}
