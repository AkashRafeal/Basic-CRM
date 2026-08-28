package com.crm.lead.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "crm_leads", indexes = {
    @Index(name = "idx_lead_email", columnList = "email"),
    @Index(name = "idx_lead_status", columnList = "lead_status"),
    @Index(name = "idx_lead_assigned_user", columnList = "assigned_to_user_id")
})
@EntityListeners(AuditingEntityListener.class)
public class Lead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 150)
    private String company;

    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_status", nullable = false, length = 30)
    private LeadStatus leadStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source", nullable = false, length = 30)
    private LeadSource leadSource;

    @Column(name = "estimated_value", precision = 12, scale = 2)
    private BigDecimal estimatedValue;

    @Builder.Default
    @Column(name = "score")
    private Integer score = 50;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "assigned_to_user_id")
    private Long assignedToUserId;

    @Column(name = "assigned_to_user_name", length = 150)
    private String assignedToUserName;

    @Column(name = "converted_customer_id")
    private Long convertedCustomerId;

    @Column(name = "converted_deal_id")
    private Long convertedDealId;

    @Column(name = "converted_at")
    private LocalDateTime convertedAt;

    @Builder.Default
    @Column(name = "is_archived", nullable = false)
    private Boolean isArchived = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public String getFullName() {
        if (lastName == null || lastName.trim().isEmpty()) {
            return firstName != null ? firstName.trim() : "";
        }
        return (firstName != null ? firstName.trim() : "") + " " + lastName.trim();
    }
}
