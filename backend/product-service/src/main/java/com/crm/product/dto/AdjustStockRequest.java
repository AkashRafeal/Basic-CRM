package com.crm.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdjustStockRequest {

    @NotNull(message = "Adjustment quantity is required (positive to restock, negative to deduct)")
    private Integer quantityChange;

    @NotBlank(message = "Reason for stock adjustment is required")
    private String reason;
}
