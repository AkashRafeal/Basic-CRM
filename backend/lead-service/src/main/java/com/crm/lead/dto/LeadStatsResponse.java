package com.crm.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadStatsResponse {

    private long totalLeads;
    private long newLeads;
    private long qualifiedLeads;
    private long convertedLeads;
    private long lostLeads;
    private double conversionRate;
    private BigDecimal totalPipelineValue;
    private Map<String, Long> statusBreakdown;
    private Map<String, Long> sourceBreakdown;
}
