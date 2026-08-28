package com.crm.product.repository;

import com.crm.product.model.BillingFrequency;
import com.crm.product.model.Product;
import com.crm.product.model.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    boolean existsBySkuIgnoreCase(String sku);

    boolean existsBySkuIgnoreCaseAndIdNot(String sku, Long id);

    @Query("""
        SELECT p FROM Product p
        WHERE p.isArchived = false
          AND (CAST(:search AS string) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.sku) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
          AND (CAST(:category AS string) IS NULL OR LOWER(p.category) = LOWER(CAST(:category AS string)))
          AND (:status IS NULL OR p.status = :status)
          AND (:billingFrequency IS NULL OR p.billingFrequency = :billingFrequency)
          AND (:minPrice IS NULL OR p.unitPrice >= :minPrice)
          AND (:maxPrice IS NULL OR p.unitPrice <= :maxPrice)
          AND (:lowStockOnly IS NULL OR :lowStockOnly = false OR (p.isPhysical = true AND p.stockQuantity <= p.lowStockThreshold))
    """)
    Page<Product> searchProducts(
            @Param("search") String search,
            @Param("category") String category,
            @Param("status") ProductStatus status,
            @Param("billingFrequency") BillingFrequency billingFrequency,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("lowStockOnly") Boolean lowStockOnly,
            Pageable pageable
    );

    List<Product> findByStatusAndIsArchivedFalseOrderByNameAsc(ProductStatus status);

    long countByIsArchivedFalse();

    long countByStatusAndIsArchivedFalse(ProductStatus status);

    @Query("SELECT COUNT(p) FROM Product p WHERE p.isArchived = false AND p.isPhysical = true AND p.stockQuantity <= p.lowStockThreshold")
    long countLowStockProducts();

    @Query("SELECT SUM(p.unitPrice * COALESCE(p.stockQuantity, 1)) FROM Product p WHERE p.isArchived = false AND p.status = 'ACTIVE'")
    BigDecimal calculateTotalCatalogValue();

    @Query("SELECT p.category, COUNT(p), AVG(p.unitPrice) FROM Product p WHERE p.isArchived = false GROUP BY p.category")
    List<Object[]> countGroupByCategory();
}
