package com.crm.lead.dto;

import com.crm.lead.model.Lead;
import com.crm.lead.model.LeadSource;
import com.crm.lead.model.LeadStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String company;
    private String jobTitle;
    private LeadStatus leadStatus;
    private String statusDisplayName;
    private LeadSource leadSource;
    private String sourceDisplayName;
    private BigDecimal estimatedValue;
    private Integer score;
    private String notes;
    private Long assignedToUserId;
    private String assignedToUserName;
    private Long convertedCustomerId;
    private Long convertedDealId;
    private LocalDateTime convertedAt;
    private Boolean isArchived;
    private Boolean convertedCustomerCreated;
    private Boolean convertedDealCreated;
    private java.util.List<Long> interestedProductIds;
    private java.util.List<LeadProductDTO> interestedProducts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static LeadResponse fromEntity(Lead lead) {
        return fromEntity(lead, null);
    }

    public static LeadResponse fromEntity(Lead lead, java.util.List<LeadProductDTO> products) {
        java.util.List<Long> pIds = products != null 
                ? products.stream().map(LeadProductDTO::getProductId).collect(java.util.stream.Collectors.toList())
                : java.util.Collections.emptyList();

        return LeadResponse.builder()
                .id(lead.getId())
                .firstName(lead.getFirstName())
                .lastName(lead.getLastName())
                .fullName(lead.getFullName())
                .email(lead.getEmail())
                .phone(lead.getPhone())
                .company(lead.getCompany())
                .jobTitle(lead.getJobTitle())
                .leadStatus(lead.getLeadStatus())
                .statusDisplayName(lead.getLeadStatus().getDisplayName())
                .leadSource(lead.getLeadSource())
                .sourceDisplayName(lead.getLeadSource().getDisplayName())
                .estimatedValue(lead.getEstimatedValue())
                .score(lead.getScore())
                .notes(lead.getNotes())
                .assignedToUserId(lead.getAssignedToUserId())
                .assignedToUserName(lead.getAssignedToUserName())
                .convertedCustomerId(lead.getConvertedCustomerId())
                .convertedDealId(lead.getConvertedDealId())
                .convertedAt(lead.getConvertedAt())
                .isArchived(lead.getIsArchived() != null ? lead.getIsArchived() : false)
                .interestedProductIds(pIds)
                .interestedProducts(products != null ? products : java.util.Collections.emptyList())
                .createdAt(lead.getCreatedAt())
                .updatedAt(lead.getUpdatedAt())
                .build();
    }
}
