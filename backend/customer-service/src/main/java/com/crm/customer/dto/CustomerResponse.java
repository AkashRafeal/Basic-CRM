package com.crm.customer.dto;

import com.crm.customer.model.Customer;
import com.crm.customer.model.CustomerStatus;
import com.crm.customer.model.CustomerTier;
import com.crm.customer.model.Industry;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerResponse {

    private Long id;
    private String name;
    private String contactPerson;
    private String email;
    private String phone;
    private String company;
    private String website;
    private Industry industry;
    private String industryDisplayName;
    private CustomerTier customerTier;
    private String tierDisplayName;
    private CustomerStatus customerStatus;
    private String statusDisplayName;
    private BigDecimal annualRevenue;
    private String billingAddress;
    private String notes;
    private Long assignedAccountManagerId;
    private String assignedAccountManagerName;
    private Long convertedFromLeadId;
    private Boolean isDeleted;
    private LocalDateTime deletedAt;
    private Long deletedByUserId;
    private String deletedByUserName;
    private String deletedByRole;
    private Boolean deleteRequested;
    private String deleteRequestReason;
    private Long createdByUserId;
    private String createdByUserName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static CustomerResponse fromEntity(Customer customer) {
        if (customer == null) return null;
        return CustomerResponse.builder()
                .id(customer.getId())
                .name(customer.getName())
                .contactPerson(customer.getContactPerson())
                .email(customer.getEmail())
                .phone(customer.getPhone())
                .company(customer.getCompany())
                .website(customer.getWebsite())
                .industry(customer.getIndustry())
                .industryDisplayName(customer.getIndustry() != null ? customer.getIndustry().getDisplayName() : null)
                .customerTier(customer.getCustomerTier())
                .tierDisplayName(customer.getCustomerTier() != null ? customer.getCustomerTier().getDisplayName() : null)
                .customerStatus(customer.getCustomerStatus())
                .statusDisplayName(customer.getCustomerStatus() != null ? customer.getCustomerStatus().getDisplayName() : null)
                .annualRevenue(customer.getAnnualRevenue())
                .billingAddress(customer.getBillingAddress())
                .notes(customer.getNotes())
                .assignedAccountManagerId(customer.getAssignedAccountManagerId())
                .assignedAccountManagerName(customer.getAssignedAccountManagerName())
                .convertedFromLeadId(customer.getConvertedFromLeadId())
                .isDeleted(customer.getIsDeleted())
                .deletedAt(customer.getDeletedAt())
                .deletedByUserId(customer.getDeletedByUserId())
                .deletedByUserName(customer.getDeletedByUserName())
                .deletedByRole(customer.getDeletedByRole())
                .deleteRequested(customer.getDeleteRequested())
                .deleteRequestReason(customer.getDeleteRequestReason())
                .createdByUserId(customer.getCreatedByUserId())
                .createdByUserName(customer.getCreatedByUserName())
                .createdByRole(customer.getCreatedByRole())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}
