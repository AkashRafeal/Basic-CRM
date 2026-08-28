package com.crm.lead.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadProductDTO {
    private Long productId;
    private String name;
    private String sku;
    private String category;
    private BigDecimal unitPrice;
    private String status;
    private Boolean isPhysical;
}
