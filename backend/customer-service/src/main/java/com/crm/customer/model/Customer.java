package com.crm.customer.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "crm_customers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "contact_person", length = 120)
    private String contactPerson;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 50)
    private String phone;

    @Column(length = 150)
    private String company;

    @Column(length = 200)
    private String website;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private Industry industry = Industry.TECHNOLOGY;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_tier", nullable = false, length = 50)
    @Builder.Default
    private CustomerTier customerTier = CustomerTier.TIER_3_SMB;

    @Enumerated(EnumType.STRING)
    @Column(name = "customer_status", nullable = false, length = 50)
    @Builder.Default
    private CustomerStatus customerStatus = CustomerStatus.ACTIVE;

    @Column(name = "annual_revenue", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal annualRevenue = BigDecimal.ZERO;

    @Column(name = "billing_address", length = 300)
    private String billingAddress;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "assigned_account_manager_id")
    private Long assignedAccountManagerId;

    @Column(name = "assigned_account_manager_name", length = 120)
    private String assignedAccountManagerName;

    @Column(name = "converted_from_lead_id")
    private Long convertedFromLeadId;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "deleted_by_user_id")
    private Long deletedByUserId;

    @Column(name = "deleted_by_user_name", length = 120)
    private String deletedByUserName;

    @Column(name = "deleted_by_role", length = 50)
    private String deletedByRole;

    @Column(name = "delete_requested", nullable = false)
    @Builder.Default
    private Boolean deleteRequested = false;

    @Column(name = "delete_request_reason", length = 300)
    private String deleteRequestReason;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "created_by_user_name", length = 120)
    private String createdByUserName;

    @Column(name = "created_by_role", length = 50)
    private String createdByRole;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
