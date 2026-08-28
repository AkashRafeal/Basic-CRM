package com.crm.product.controller;

import com.crm.product.common.ApiResponse;
import com.crm.product.dto.*;
import com.crm.product.model.BillingFrequency;
import com.crm.product.model.ProductStatus;
import com.crm.product.security.UserPrincipal;
import com.crm.product.service.ProductService;
import com.crm.product.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Product & Catalog Management", description = "Endpoints for managing products, SaaS subscriptions, inventory stock, and pricing in ₹ INR")
public class ProductController {

    private final ProductService productService;
    private final CategoryService categoryService;

    @GetMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get list of all product categories")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok("Categories retrieved successfully", categories));
    }

    @PostMapping("/categories")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Add a new product category (Admin & Manager)")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CreateCategoryRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CategoryResponse created = categoryService.createCategory(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Product category created successfully", created));
    }

    @DeleteMapping("/categories/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a custom product category (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        categoryService.deleteCategory(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Category deleted successfully", null));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Search and list products with multi-criteria filtering")
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(required = false) BillingFrequency billingFrequency,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean lowStockOnly,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<ProductResponse> productPage = productService.getProducts(
                search, category, status, billingFrequency, minPrice, maxPrice, lowStockOnly, PageRequest.of(page, size, sort), principal
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", productPage.getContent());
        response.put("currentPage", productPage.getNumber());
        response.put("totalItems", productPage.getTotalElements());
        response.put("totalPages", productPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/catalog")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get active products for quoting, proposal generation, and deal line-items")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getActiveCatalog(@AuthenticationPrincipal UserPrincipal principal) {
        List<ProductResponse> catalog = productService.getActiveCatalog(principal);
        return ResponseEntity.ok(ApiResponse.ok("Active product catalog retrieved", catalog));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get catalog KPIs, total ₹ value, inventory alerts, and category distributions")
    public ResponseEntity<ApiResponse<ProductStatsResponse>> getProductStats(@AuthenticationPrincipal UserPrincipal principal) {
        ProductStatsResponse stats = productService.getProductStats(principal);
        return ResponseEntity.ok(ApiResponse.ok("Product statistics retrieved successfully", stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get product specifications and pricing details by ID")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProductResponse product = productService.getProductById(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Product retrieved successfully", product));
    }

    @GetMapping("/sku/{sku}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get product by SKU identifier")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySku(
            @PathVariable String sku,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProductResponse product = productService.getProductBySku(sku, principal);
        return ResponseEntity.ok(ApiResponse.ok("Product retrieved successfully", product));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new product or service item (Admin only)")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProductResponse created = productService.createProduct(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Product created successfully in catalog", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update product specifications and pricing (Admin only)")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody UpdateProductRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProductResponse updated = productService.updateProduct(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Product updated successfully", updated));
    }

    @PatchMapping("/{id}/stock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restock or deduct physical inventory count with audit note (Admin only)")
    public ResponseEntity<ApiResponse<ProductResponse>> adjustStock(
            @PathVariable Long id,
            @Valid @RequestBody AdjustStockRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProductResponse updated = productService.adjustStock(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Inventory stock adjusted successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Archive or permanently purge product (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @PathVariable Long id,
            @RequestParam(defaultValue = "false") boolean permanent,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        productService.deleteProduct(id, permanent, principal);
        String msg = permanent ? "Product permanently removed from database" : "Product archived and deactivated";
        return ResponseEntity.ok(ApiResponse.ok(msg, null));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Export product catalog to CSV (Admin & Manager only)")
    public void exportProductsCsv(
            HttpServletResponse response,
            @AuthenticationPrincipal UserPrincipal principal
    ) throws IOException {
        if (principal != null && principal.isEmployee()) {
            throw new AccessDeniedException("Data export is restricted for sales representatives.");
        }

        List<ProductResponse> products = productService.getActiveCatalog(principal);

        response.setContentType("text/csv");
        String filename = "product_catalog_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")) + ".csv";
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        PrintWriter writer = response.getWriter();
        writer.println("ID,SKU,Name,Category,Billing Frequency,Unit Price (INR),Cost Price (INR),Tax Rate %,Status,Stock Quantity,Is Physical");

        for (ProductResponse p : products) {
            writer.printf("%d,\"%s\",\"%s\",\"%s\",\"%s\",%.2f,%s,%.2f,\"%s\",%s,%s\n",
                    p.getId(),
                    p.getSku(),
                    escapeCsv(p.getName()),
                    p.getCategoryDisplayName(),
                    p.getBillingFrequencyDisplayName(),
                    p.getUnitPrice() != null ? p.getUnitPrice().doubleValue() : 0.0,
                    p.getCostPrice() != null ? String.format("%.2f", p.getCostPrice().doubleValue()) : "N/A",
                    p.getTaxRate() != null ? p.getTaxRate().doubleValue() : 18.0,
                    p.getStatusDisplayName(),
                    p.getStockQuantity() != null ? p.getStockQuantity().toString() : "N/A",
                    p.getIsPhysical()
            );
        }
        writer.flush();
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }
}
