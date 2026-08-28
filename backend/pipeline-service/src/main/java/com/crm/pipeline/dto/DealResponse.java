package com.crm.pipeline.dto;

import com.crm.pipeline.model.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealResponse {

    private Long id;
    private String dealName;
    private DealStage stage;
    private String stageDisplayName;
    private BigDecimal amount;
    private Integer probability;
    private BigDecimal expectedRevenue;
    private LocalDate expectedCloseDate;
    private LocalDate actualCloseDate;
    private DealType dealType;
    private String dealTypeDisplayName;
    private DealPriority priority;
    private String priorityDisplayName;
    private Long customerId;
    private String customerName;
    private Long leadId;
    private Long assignedToUserId;
    private String assignedToUserName;
    private String description;
    private String lossReason;
    private boolean isWon;
    private boolean isLost;
    private java.util.List<DealItemResponse> items;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static DealResponse fromEntity(Deal deal) {
        return fromEntity(deal, null);
    }

    public static DealResponse fromEntity(Deal deal, java.util.List<DealItemResponse> items) {
        if (deal == null) return null;

        return DealResponse.builder()
                .id(deal.getId())
                .dealName(deal.getDealName())
                .stage(deal.getStage())
                .stageDisplayName(deal.getStage() != null ? deal.getStage().getDisplayName() : null)
                .amount(deal.getAmount())
                .probability(deal.getProbability())
                .expectedRevenue(deal.getExpectedRevenue())
                .expectedCloseDate(deal.getExpectedCloseDate())
                .actualCloseDate(deal.getActualCloseDate())
                .dealType(deal.getDealType())
                .dealTypeDisplayName(deal.getDealType() != null ? deal.getDealType().getDisplayName() : null)
                .priority(deal.getPriority())
                .priorityDisplayName(deal.getPriority() != null ? deal.getPriority().getDisplayName() : null)
                .customerId(deal.getCustomerId())
                .customerName(deal.getCustomerName())
                .leadId(deal.getLeadId())
                .assignedToUserId(deal.getAssignedToUserId())
                .assignedToUserName(deal.getAssignedToUserName())
                .description(deal.getDescription())
                .lossReason(deal.getLossReason())
                .isWon(deal.getStage() == DealStage.CLOSED_WON)
                .isLost(deal.getStage() == DealStage.CLOSED_LOST)
                .items(items != null ? items : java.util.Collections.emptyList())
                .createdAt(deal.getCreatedAt())
                .updatedAt(deal.getUpdatedAt())
                .build();
    }
}
