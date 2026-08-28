package com.crm.analytics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LeadSourceReport {

    private long totalLeads;
    private long convertedLeads;
    private double overallConversionRate;
    private BigDecimal totalEstimatedValue;
    private List<LeadSourceMetric> sourceMetrics;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LeadSourceMetric {
        private String source;
        private String sourceDisplayName;
        private long leadCount;
        private long convertedCount;
        private double conversionRate;
        private BigDecimal totalValue;
    }
}
