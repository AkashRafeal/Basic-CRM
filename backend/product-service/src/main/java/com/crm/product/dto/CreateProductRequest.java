package com.crm.product.dto;

import com.crm.product.model.BillingFrequency;
import com.crm.product.model.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 150, message = "Product name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "SKU is required")
    @Size(max = 60, message = "SKU must not exceed 60 characters")
    private String sku;

    @NotBlank(message = "Product category is required")
    @Size(max = 100, message = "Category name must not exceed 100 characters")
    private String category;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Unit price (₹) is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Unit price cannot be negative")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Cost price cannot be negative")
    private BigDecimal costPrice;

    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(18.00);

    @Builder.Default
    private BillingFrequency billingFrequency = BillingFrequency.ONE_TIME;

    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    private Integer stockQuantity;

    @Builder.Default
    private Integer lowStockThreshold = 10;

    @Builder.Default
    private Integer minQuantity = 1;

    @Builder.Default
    private BigDecimal maxDiscountPercent = BigDecimal.valueOf(25.00);

    @Builder.Default
    private Boolean isPhysical = false;

    @Builder.Default
    private String currencyCode = "INR";
}
