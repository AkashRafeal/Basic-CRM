package com.crm.pipeline.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "crm_deals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "deal_name", nullable = false, length = 200)
    private String dealName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private DealStage stage = DealStage.QUALIFICATION;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    @Builder.Default
    private Integer probability = 10;

    @Column(name = "expected_revenue", precision = 15, scale = 2)
    private BigDecimal expectedRevenue;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @Column(name = "actual_close_date")
    private LocalDate actualCloseDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "deal_type", nullable = false, length = 50)
    @Builder.Default
    private DealType dealType = DealType.NEW_BUSINESS;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private DealPriority priority = DealPriority.MEDIUM;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "lead_id")
    private Long leadId;

    @Column(name = "assigned_to_user_id")
    private Long assignedToUserId;

    @Column(name = "assigned_to_user_name", length = 120)
    private String assignedToUserName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "loss_reason", length = 250)
    private String lossReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void calculateExpectedRevenue() {
        if (this.amount != null) {
            int prob = this.probability != null ? this.probability : (this.stage != null ? this.stage.getDefaultProbability() : 0);
            this.probability = prob;
            this.expectedRevenue = this.amount.multiply(BigDecimal.valueOf(prob))
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }
    }
}
