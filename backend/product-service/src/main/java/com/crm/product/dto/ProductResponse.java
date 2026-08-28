package com.crm.product.dto;

import com.crm.product.model.BillingFrequency;
import com.crm.product.model.Product;
import com.crm.product.model.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String sku;
    private String category;
    private String categoryDisplayName;
    private String description;
    private BigDecimal unitPrice;
    private BigDecimal costPrice; // Hidden for Employee
    private BigDecimal marginAmount; // Hidden for Employee
    private BigDecimal marginPercent; // Hidden for Employee
    private BigDecimal taxRate;
    private BillingFrequency billingFrequency;
    private String billingFrequencyDisplayName;
    private ProductStatus status;
    private String statusDisplayName;
    private Integer stockQuantity;
    private Integer lowStockThreshold;
    private Boolean isLowStock;
    private Integer minQuantity;
    private BigDecimal maxDiscountPercent;
    private Boolean isPhysical;
    private String currencyCode;
    private Boolean isArchived;
    private Long createdByUserId;
    private String createdByUserName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductResponse fromEntity(Product p, boolean includeMarginDetails) {
        if (p == null) return null;

        BigDecimal margin = null;
        BigDecimal marginPct = null;

        if (includeMarginDetails && p.getCostPrice() != null && p.getUnitPrice() != null) {
            margin = p.getUnitPrice().subtract(p.getCostPrice());
            if (p.getUnitPrice().compareTo(BigDecimal.ZERO) > 0) {
                marginPct = margin.multiply(BigDecimal.valueOf(100.0))
                        .divide(p.getUnitPrice(), 2, RoundingMode.HALF_UP);
            }
        }

        boolean lowStock = Boolean.TRUE.equals(p.getIsPhysical()) &&
                p.getStockQuantity() != null &&
                p.getLowStockThreshold() != null &&
                p.getStockQuantity() <= p.getLowStockThreshold();

        return ProductResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .sku(p.getSku())
                .category(p.getCategory())
                .categoryDisplayName(p.getCategory())
                .description(p.getDescription())
                .unitPrice(p.getUnitPrice())
                .costPrice(includeMarginDetails ? p.getCostPrice() : null)
                .marginAmount(margin)
                .marginPercent(marginPct)
                .taxRate(p.getTaxRate())
                .billingFrequency(p.getBillingFrequency())
                .billingFrequencyDisplayName(p.getBillingFrequency() != null ? p.getBillingFrequency().getDisplayName() : null)
                .status(p.getStatus())
                .statusDisplayName(p.getStatus() != null ? p.getStatus().getDisplayName() : null)
                .stockQuantity(p.getStockQuantity())
                .lowStockThreshold(p.getLowStockThreshold())
                .isLowStock(lowStock)
                .minQuantity(p.getMinQuantity())
                .maxDiscountPercent(p.getMaxDiscountPercent())
                .isPhysical(p.getIsPhysical())
                .currencyCode(p.getCurrencyCode() != null ? p.getCurrencyCode() : "INR")
                .isArchived(p.getIsArchived())
                .createdByUserId(p.getCreatedByUserId())
                .createdByUserName(p.getCreatedByUserName())
                .createdByRole(p.getCreatedByRole())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }
}
