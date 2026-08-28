package com.crm.product.dto;

import com.crm.product.model.BillingFrequency;
import com.crm.product.model.ProductStatus;
import jakarta.validation.constraints.DecimalMin;
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
public class UpdateProductRequest {

    @Size(max = 150, message = "Product name must not exceed 150 characters")
    private String name;

    @Size(max = 60, message = "SKU must not exceed 60 characters")
    private String sku;

    @Size(max = 100, message = "Category must not exceed 100 characters")
    private String category;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @DecimalMin(value = "0.0", inclusive = true, message = "Unit price cannot be negative")
    private BigDecimal unitPrice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Cost price cannot be negative")
    private BigDecimal costPrice;

    private BigDecimal taxRate;

    private BillingFrequency billingFrequency;

    private ProductStatus status;

    private Integer stockQuantity;

    private Integer lowStockThreshold;

    private Integer minQuantity;

    private BigDecimal maxDiscountPercent;

    private Boolean isPhysical;
}
