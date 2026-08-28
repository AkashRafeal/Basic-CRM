package com.crm.customer.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignCustomerProductRequest {

    @NotNull(message = "Product ID is required")
    private Long productId;

    private String productName;

    @Builder.Default
    private Integer quantity = 1;

    private BigDecimal unitPrice;

    private BigDecimal totalAmount;

    @Builder.Default
    private String status = "ACTIVE";

    private LocalDate startDate;

    private LocalDate expiryDate;

    private String billingFrequency;
}
