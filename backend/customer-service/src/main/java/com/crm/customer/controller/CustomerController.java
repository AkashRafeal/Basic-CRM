package com.crm.customer.controller;

import com.crm.customer.common.ApiResponse;
import com.crm.customer.dto.*;
import com.crm.customer.model.CustomerStatus;
import com.crm.customer.model.CustomerTier;
import com.crm.customer.model.Industry;
import com.crm.customer.security.UserPrincipal;
import com.crm.customer.service.CustomerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
@Tag(name = "Customer Management", description = "Endpoints for managing customer accounts, ARR tracking, health status, and analytics")
public class CustomerController {

    private final CustomerService customerService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Search and list customer accounts with multi-criteria filtering")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getAllCustomers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CustomerStatus status,
            @RequestParam(required = false) CustomerTier tier,
            @RequestParam(required = false) Industry industry,
            @RequestParam(required = false) Long assignedId,
            @RequestParam(required = false) Boolean isDeleted
    ) {
        List<CustomerResponse> customers = customerService.searchCustomers(search, status, tier, industry, assignedId, isDeleted);
        return ResponseEntity.ok(ApiResponse.ok("Customers retrieved successfully", customers));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get executive customer statistics, ARR revenue, and health breakdown")
    public ResponseEntity<ApiResponse<CustomerStatsResponse>> getCustomerStats() {
        CustomerStatsResponse stats = customerService.getCustomerStats();
        return ResponseEntity.ok(ApiResponse.ok("Customer statistics retrieved successfully", stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get single customer profile details by ID")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long id) {
        CustomerResponse customer = customerService.getCustomerById(id);
        return ResponseEntity.ok(ApiResponse.ok("Customer retrieved successfully", customer));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create a new customer account")
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(
            @Valid @RequestBody CreateCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Long effectiveUserId = principal != null ? principal.getId() : userId;
        String effectiveUserName = principal != null ? principal.getName() : userName;
        String effectiveUserRole = principal != null ? principal.getRole() : userRole;

        if (request.getCreatedByUserId() == null && effectiveUserId != null) {
            request.setCreatedByUserId(effectiveUserId);
        }
        if (request.getCreatedByUserName() == null && effectiveUserName != null) {
            request.setCreatedByUserName(effectiveUserName);
        }
        if (request.getCreatedByRole() == null && effectiveUserRole != null) {
            request.setCreatedByRole(effectiveUserRole);
        }
        CustomerResponse created = customerService.createCustomer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Customer account created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update customer account information")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerRequest request
    ) {
        CustomerResponse updated = customerService.updateCustomer(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Customer account updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update customer health lifecycle status")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomerStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCustomerStatusRequest request
    ) {
        CustomerResponse updated = customerService.updateCustomerStatus(id, request.getCustomerStatus());
        return ResponseEntity.ok(ApiResponse.ok("Customer status updated successfully", updated));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Assign or claim an account manager for a customer (Admin, Manager, or Employee if unassigned)")
    public ResponseEntity<ApiResponse<CustomerResponse>> assignAccountManager(
            @PathVariable Long id,
            @Valid @RequestBody AssignCustomerRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Long effectiveUserId = principal != null ? principal.getId() : userId;
        String effectiveUserName = principal != null ? principal.getName() : userName;
        String effectiveUserRole = principal != null ? principal.getRole() : userRole;

        CustomerResponse updated = customerService.assignAccountManager(
                id,
                request.getAssignedAccountManagerId(),
                request.getAssignedAccountManagerName(),
                effectiveUserId,
                effectiveUserName,
                effectiveUserRole
        );
        return ResponseEntity.ok(ApiResponse.ok("Account manager assigned successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Soft delete / request deletion of a customer account (Admin & Manager only)")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(
            @PathVariable Long id,
            @RequestParam(required = false) String reason,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Long effectiveUserId = principal != null ? principal.getId() : userId;
        String effectiveUserName = principal != null ? principal.getName() : (userName != null ? userName : "Authorized User");
        String effectiveUserRole = principal != null ? principal.getRole() : (userRole != null ? userRole : "ROLE_MANAGER");

        customerService.deleteCustomer(id, effectiveUserId, effectiveUserName, effectiveUserRole, reason);
        return ResponseEntity.ok(ApiResponse.ok("Customer deleted / deletion requested successfully", null));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restore a soft-deleted customer (Admin only)")
    public ResponseEntity<ApiResponse<CustomerResponse>> restoreCustomer(@PathVariable Long id) {
        CustomerResponse restored = customerService.restoreCustomer(id);
        return ResponseEntity.ok(ApiResponse.ok("Customer restored successfully", restored));
    }

    @GetMapping("/{id}/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get all products/services purchased or subscribed by customer")
    public ResponseEntity<ApiResponse<List<CustomerProductDTO>>> getCustomerProducts(@PathVariable Long id) {
        List<CustomerProductDTO> products = customerService.getCustomerProducts(id);
        return ResponseEntity.ok(ApiResponse.ok("Customer products retrieved successfully", products));
    }

    @PostMapping("/{id}/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Assign or subscribe a product/service to customer")
    public ResponseEntity<ApiResponse<CustomerProductDTO>> assignProductToCustomer(
            @PathVariable Long id,
            @Valid @RequestBody AssignCustomerProductRequest request
    ) {
        CustomerProductDTO assigned = customerService.assignProductToCustomer(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Product assigned to customer successfully", assigned));
    }

    @DeleteMapping("/{id}/products/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Remove a product subscription from customer")
    public ResponseEntity<ApiResponse<Void>> deleteCustomerProduct(
            @PathVariable Long id,
            @PathVariable Long productId
    ) {
        customerService.deleteCustomerProduct(id, productId);
        return ResponseEntity.ok(ApiResponse.ok("Customer product removed successfully", null));
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Permanently delete a customer from database (Admin only)")
    public ResponseEntity<ApiResponse<Void>> permanentlyDeleteCustomer(@PathVariable Long id) {
        customerService.permanentlyDeleteCustomer(id);
        return ResponseEntity.ok(ApiResponse.ok("Customer permanently deleted successfully", null));
    }
}
