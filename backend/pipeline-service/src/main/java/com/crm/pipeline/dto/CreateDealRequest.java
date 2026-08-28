package com.crm.pipeline.dto;

import com.crm.pipeline.model.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateDealRequest {

    @NotBlank(message = "Deal name is required")
    @Size(max = 200, message = "Deal name must not exceed 200 characters")
    private String dealName;

    private DealStage stage;

    @NotNull(message = "Deal value/amount is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Deal amount must be greater than 0")
    private BigDecimal amount;

    private Integer probability;

    private LocalDate expectedCloseDate;

    private DealType dealType;

    private DealPriority priority;

    private Long customerId;

    private String customerName;

    private Long leadId;

    private Long assignedToUserId;

    private String assignedToUserName;

    private String description;

    private java.util.List<DealItemRequest> items;
}
