package com.crm.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerIndustryReport {

    private long totalCustomers;
    private BigDecimal totalAnnualRevenue;
    private BigDecimal averageCustomerArr;
    private double overallRetentionRate;
    private List<IndustryMetric> industryMetrics;
    private Map<String, Long> tierBreakdown;
    private Map<String, BigDecimal> tierRevenue;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class IndustryMetric {
        private String industry;
        private String industryDisplayName;
        private long customerCount;
        private BigDecimal totalArr;
        private double revenueSharePercent;
    }
}
