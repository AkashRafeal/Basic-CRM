package com.crm.customer.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerStatsResponse {

    private long totalCustomers;
    private long activeCustomers;
    private long onboardingCustomers;
    private long atRiskCustomers;
    private long churnedCustomers;
    private BigDecimal totalAnnualRevenue;
    private BigDecimal activeAnnualRevenue;
    private double retentionRate;
    private long trashCustomersCount;
    private Map<String, Long> customersByTier;
    private Map<String, Long> customersByIndustry;
    private Map<String, Long> customersByStatus;
}
