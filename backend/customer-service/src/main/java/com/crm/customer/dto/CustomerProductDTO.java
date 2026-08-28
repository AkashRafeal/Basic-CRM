package com.crm.customer.dto;

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
public class CustomerProductDTO {

    private Long id;
    private Long customerId;
    private Long productId;
    private String productName;
    private Long dealId;
    private Integer quantity;
    private BigDecimal unitPrice;
    private BigDecimal totalAmount;
    private String status;
    private LocalDate purchaseDate;
    private LocalDate startDate;
    private LocalDate expiryDate;
    private String billingFrequency;
}
