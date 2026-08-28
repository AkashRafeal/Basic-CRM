package com.crm.product.dto;

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
public class ProductStatsResponse {

    private long totalProducts;
    private long activeProducts;
    private long draftProducts;
    private long discontinuedProducts;
    private long lowStockAlerts;
    private BigDecimal totalCatalogValue; // in ₹
    private BigDecimal averageMarginPercent; // Admin/Manager only
    private Map<String, Long> countByCategory;
    private Map<String, BigDecimal> averagePriceByCategory;
}
