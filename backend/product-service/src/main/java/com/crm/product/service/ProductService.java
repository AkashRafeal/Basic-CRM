package com.crm.product.service;

import com.crm.product.dto.*;
import com.crm.product.exception.ResourceNotFoundException;
import com.crm.product.model.BillingFrequency;
import com.crm.product.model.Product;
import com.crm.product.model.ProductStatus;
import com.crm.product.repository.ProductRepository;
import com.crm.product.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProducts(
            String search,
            String category,
            ProductStatus status,
            BillingFrequency billingFrequency,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Boolean lowStockOnly,
            Pageable pageable,
            UserPrincipal principal
    ) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanCategory = (category != null && !category.trim().isEmpty()) ? category.trim() : null;
        boolean includeMargins = principal != null && (principal.isAdmin() || principal.isManager());

        // For Employee / Sales Rep: Restricted to Active sellable items only
        if (principal != null && !principal.isAdmin() && !principal.isManager()) {
            status = ProductStatus.ACTIVE;
        }

        return productRepository.searchProducts(
                cleanSearch, cleanCategory, status, billingFrequency, minPrice, maxPrice, lowStockOnly, pageable
        ).map(p -> ProductResponse.fromEntity(p, includeMargins));
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getActiveCatalog(UserPrincipal principal) {
        boolean includeMargins = principal != null && (principal.isAdmin() || principal.isManager());
        return productRepository.findByStatusAndIsArchivedFalseOrderByNameAsc(ProductStatus.ACTIVE)
                .stream()
                .map(p -> ProductResponse.fromEntity(p, includeMargins))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(Long id, UserPrincipal principal) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        boolean includeMargins = principal != null && (principal.isAdmin() || principal.isManager());
        return ProductResponse.fromEntity(product, includeMargins);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductBySku(String sku, UserPrincipal principal) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with SKU: " + sku));

        boolean includeMargins = principal != null && (principal.isAdmin() || principal.isManager());
        return ProductResponse.fromEntity(product, includeMargins);
    }

    @Transactional
    public ProductResponse createProduct(CreateProductRequest req, UserPrincipal principal) {
        if (principal != null && !principal.isAdmin()) {
            throw new AccessDeniedException("Only Administrators are permitted to add new products or services to the master catalog.");
        }

        String cleanSku = req.getSku().trim().toUpperCase();
        if (productRepository.existsBySkuIgnoreCase(cleanSku)) {
            throw new IllegalArgumentException("A product with SKU '" + cleanSku + "' already exists in the catalog.");
        }

        Product product = Product.builder()
                .name(req.getName().trim())
                .sku(cleanSku)
                .category(req.getCategory())
                .description(req.getDescription() != null ? req.getDescription().trim() : null)
                .unitPrice(req.getUnitPrice())
                .costPrice(req.getCostPrice())
                .taxRate(req.getTaxRate() != null ? req.getTaxRate() : BigDecimal.valueOf(18.00))
                .billingFrequency(req.getBillingFrequency() != null ? req.getBillingFrequency() : BillingFrequency.ONE_TIME)
                .status(req.getStatus() != null ? req.getStatus() : ProductStatus.ACTIVE)
                .stockQuantity(req.getStockQuantity())
                .lowStockThreshold(req.getLowStockThreshold() != null ? req.getLowStockThreshold() : 10)
                .minQuantity(req.getMinQuantity() != null ? req.getMinQuantity() : 1)
                .maxDiscountPercent(req.getMaxDiscountPercent() != null ? req.getMaxDiscountPercent() : BigDecimal.valueOf(25.00))
                .isPhysical(Boolean.TRUE.equals(req.getIsPhysical()))
                .currencyCode(req.getCurrencyCode() != null ? req.getCurrencyCode() : "INR")
                .isArchived(false)
                .createdByUserId(principal != null ? principal.getId() : null)
                .createdByUserName(principal != null ? principal.getName() : null)
                .createdByRole(principal != null ? principal.getRole() : null)
                .build();

        Product saved = productRepository.save(product);
        log.info("Created product '{}' (SKU: {}, ID: {}) by user {}", saved.getName(), saved.getSku(), saved.getId(), principal != null ? principal.getName() : "System");
        return ProductResponse.fromEntity(saved, true);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, UpdateProductRequest req, UserPrincipal principal) {
        if (principal != null && !principal.isAdmin()) {
            throw new AccessDeniedException("Only Administrators are permitted to modify base pricing, billing cycles, or tax rates.");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        if (req.getSku() != null && !req.getSku().trim().isEmpty()) {
            String cleanSku = req.getSku().trim().toUpperCase();
            if (productRepository.existsBySkuIgnoreCaseAndIdNot(cleanSku, id)) {
                throw new IllegalArgumentException("SKU '" + cleanSku + "' is already in use by another product.");
            }
            product.setSku(cleanSku);
        }

        if (req.getName() != null && !req.getName().trim().isEmpty()) product.setName(req.getName().trim());
        if (req.getCategory() != null) product.setCategory(req.getCategory());
        if (req.getDescription() != null) product.setDescription(req.getDescription().trim());
        if (req.getUnitPrice() != null) product.setUnitPrice(req.getUnitPrice());
        if (req.getCostPrice() != null) product.setCostPrice(req.getCostPrice());
        if (req.getTaxRate() != null) product.setTaxRate(req.getTaxRate());
        if (req.getBillingFrequency() != null) product.setBillingFrequency(req.getBillingFrequency());
        if (req.getStatus() != null) product.setStatus(req.getStatus());
        if (req.getStockQuantity() != null) product.setStockQuantity(req.getStockQuantity());
        if (req.getLowStockThreshold() != null) product.setLowStockThreshold(req.getLowStockThreshold());
        if (req.getMinQuantity() != null) product.setMinQuantity(req.getMinQuantity());
        if (req.getMaxDiscountPercent() != null) product.setMaxDiscountPercent(req.getMaxDiscountPercent());
        if (req.getIsPhysical() != null) product.setIsPhysical(req.getIsPhysical());

        Product saved = productRepository.save(product);
        log.info("Updated product ID {} by user {}", id, principal != null ? principal.getName() : "System");
        return ProductResponse.fromEntity(saved, true);
    }

    @Transactional
    public ProductResponse adjustStock(Long id, AdjustStockRequest req, UserPrincipal principal) {
        if (principal != null && !principal.isAdmin()) {
            throw new AccessDeniedException("Only Administrators are permitted to adjust inventory stock counts.");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        if (!Boolean.TRUE.equals(product.getIsPhysical())) {
            throw new IllegalArgumentException("Stock inventory tracking is only applicable to physical products/hardware.");
        }

        int current = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int next = current + req.getQuantityChange();
        if (next < 0) {
            throw new IllegalArgumentException("Cannot reduce stock below 0. Current available stock: " + current);
        }

        product.setStockQuantity(next);
        if (next == 0 && product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (next > 0 && product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        Product saved = productRepository.save(product);
        log.info("Stock adjusted for product '{}' (SKU: {}): {} -> {} (Reason: {}) by user {}",
                saved.getName(), saved.getSku(), current, next, req.getReason(), principal != null ? principal.getName() : "System");

        return ProductResponse.fromEntity(saved, true);
    }

    @Transactional
    public void deleteProduct(Long id, boolean permanent, UserPrincipal principal) {
        if (principal == null || !principal.isAdmin()) {
            throw new AccessDeniedException("Only Administrators are permitted to delete or archive products.");
        }

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with ID: " + id));

        if (permanent) {
            productRepository.delete(product);
            log.info("Administrator {} permanently deleted product ID: {}", principal.getName(), id);
        } else {
            product.setIsArchived(true);
            product.setStatus(ProductStatus.DISCONTINUED);
            productRepository.save(product);
            log.info("Administrator {} soft-archived product ID: {}", principal.getName(), id);
        }
    }

    @Transactional(readOnly = true)
    public ProductStatsResponse getProductStats(UserPrincipal principal) {
        long total = productRepository.countByIsArchivedFalse();
        long active = productRepository.countByStatusAndIsArchivedFalse(ProductStatus.ACTIVE);
        long draft = productRepository.countByStatusAndIsArchivedFalse(ProductStatus.DRAFT);
        long discontinued = productRepository.countByStatusAndIsArchivedFalse(ProductStatus.DISCONTINUED);
        long lowStock = productRepository.countLowStockProducts();
        BigDecimal catalogVal = productRepository.calculateTotalCatalogValue();

        Map<String, Long> categoryCounts = new HashMap<>();
        Map<String, BigDecimal> categoryAvgPrices = new HashMap<>();

        for (Object[] row : productRepository.countGroupByCategory()) {
            if (row[0] != null) {
                String cat = row[0].toString();
                categoryCounts.put(cat, ((Number) row[1]).longValue());
                if (row[2] != null) {
                    categoryAvgPrices.put(cat, BigDecimal.valueOf(((Number) row[2]).doubleValue()).setScale(2, RoundingMode.HALF_UP));
                }
            }
        }

        return ProductStatsResponse.builder()
                .totalProducts(total)
                .activeProducts(active)
                .draftProducts(draft)
                .discontinuedProducts(discontinued)
                .lowStockAlerts(lowStock)
                .totalCatalogValue(catalogVal != null ? catalogVal : BigDecimal.ZERO)
                .countByCategory(categoryCounts)
                .averagePriceByCategory(categoryAvgPrices)
                .build();
    }
}
