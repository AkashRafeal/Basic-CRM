package com.crm.pipeline.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DealItemRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    private String productName;

    @Builder.Default
    private Integer quantity = 1;

    private BigDecimal unitPrice;

    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal discountPercentage = BigDecimal.ZERO;

    private BigDecimal totalPrice;
}
