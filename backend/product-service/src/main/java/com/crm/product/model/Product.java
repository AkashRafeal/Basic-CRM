package com.crm.product.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "crm_products", indexes = {
    @Index(name = "idx_product_sku", columnList = "sku"),
    @Index(name = "idx_product_category", columnList = "category"),
    @Index(name = "idx_product_status", columnList = "status")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, unique = true, length = 60)
    private String sku;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 2000)
    private String description;

    @Column(name = "unit_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "cost_price", precision = 14, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "tax_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(18.00); // 18% GST default

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_frequency", nullable = false, length = 40)
    @Builder.Default
    private BillingFrequency billingFrequency = BillingFrequency.ONE_TIME;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    @Builder.Default
    private ProductStatus status = ProductStatus.ACTIVE;

    @Column(name = "stock_quantity")
    private Integer stockQuantity; // Nullable for pure SaaS/services

    @Column(name = "low_stock_threshold")
    @Builder.Default
    private Integer lowStockThreshold = 10;

    @Column(name = "min_quantity")
    @Builder.Default
    private Integer minQuantity = 1;

    @Column(name = "max_discount_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal maxDiscountPercent = BigDecimal.valueOf(25.00); // 25% max discount by default

    @Column(name = "is_physical")
    @Builder.Default
    private Boolean isPhysical = false;

    @Column(name = "currency_code", length = 10)
    @Builder.Default
    private String currencyCode = "INR";

    @Column(name = "is_archived")
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;

    @Column(name = "created_by_user_name", length = 120)
    private String createdByUserName;

    @Column(name = "created_by_role", length = 60)
    private String createdByRole;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
