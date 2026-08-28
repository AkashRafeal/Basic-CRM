package com.crm.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPerformanceReport {

    private long totalProducts;
    private long activeProducts;
    private BigDecimal totalProductRevenue;
    private BigDecimal totalProductPipelineValue;
    private List<ProductMetricItem> products;
    private List<ProductMetricItem> topRevenueProducts;
    private List<ProductMetricItem> topInterestedProducts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductMetricItem {
        private Long productId;
        private String productName;
        private String sku;
        private String category;
        private BigDecimal unitPrice;
        private String status;
        private Boolean isPhysical;
        private long interestedLeadsCount;
        private long totalDealsCount;
        private long wonDealsCount;
        private BigDecimal pipelineValue;
        private BigDecimal closedWonRevenue;
        private long activeCustomersCount;
        private double conversionRate;
    }
}
