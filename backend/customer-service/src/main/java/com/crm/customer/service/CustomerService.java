package com.crm.customer.service;

import com.crm.customer.common.ResourceNotFoundException;
import com.crm.customer.dto.*;
import com.crm.customer.model.*;
import com.crm.customer.repository.CustomerRepository;
import com.crm.customer.repository.CustomerProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final CustomerProductRepository customerProductRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Transactional(readOnly = true)
    public List<CustomerResponse> searchCustomers(
            String search,
            CustomerStatus status,
            CustomerTier tier,
            Industry industry,
            Long assignedId,
            Boolean isDeleted
    ) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        Boolean filterDeleted = isDeleted != null ? isDeleted : false;
        return customerRepository.searchCustomers(cleanSearch, status, tier, industry, assignedId, filterDeleted)
                .stream()
                .map(CustomerResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CustomerResponse getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));
        return CustomerResponse.fromEntity(customer);
    }

    @Transactional
    public CustomerResponse createCustomer(CreateCustomerRequest request) {
        if (customerRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new IllegalArgumentException("Customer with email " + request.getEmail() + " already exists");
        }

        String cleanPhone = validateAndCleanPhone(request.getPhone());

        Customer customer = Customer.builder()
                .name(request.getName())
                .contactPerson(request.getContactPerson())
                .email(request.getEmail())
                .phone(cleanPhone)
                .company(request.getCompany())
                .website(request.getWebsite())
                .industry(request.getIndustry() != null ? request.getIndustry() : Industry.TECHNOLOGY)
                .customerTier(request.getCustomerTier() != null ? request.getCustomerTier() : CustomerTier.TIER_3_SMB)
                .customerStatus(request.getCustomerStatus() != null ? request.getCustomerStatus() : CustomerStatus.ACTIVE)
                .annualRevenue(request.getAnnualRevenue() != null ? request.getAnnualRevenue() : BigDecimal.ZERO)
                .billingAddress(request.getBillingAddress())
                .notes(request.getNotes())
                .assignedAccountManagerId(request.getAssignedAccountManagerId())
                .assignedAccountManagerName(request.getAssignedAccountManagerName())
                .convertedFromLeadId(request.getConvertedFromLeadId())
                .createdByUserId(request.getCreatedByUserId())
                .createdByUserName(request.getCreatedByUserName())
                .createdByRole(request.getCreatedByRole())
                .isDeleted(false)
                .deleteRequested(false)
                .build();

        Customer saved = customerRepository.save(customer);
        log.info("Created new customer account '{}' (id: {}) by user: {}", saved.getName(), saved.getId(), request.getCreatedByUserName());
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public CustomerResponse updateCustomer(Long id, UpdateCustomerRequest request) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        if (!customer.getEmail().equalsIgnoreCase(request.getEmail()) && customerRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new IllegalArgumentException("Customer with email " + request.getEmail() + " already exists");
        }

        customer.setName(request.getName());
        customer.setContactPerson(request.getContactPerson());
        customer.setEmail(request.getEmail());
        customer.setPhone(validateAndCleanPhone(request.getPhone()));
        customer.setCompany(request.getCompany());
        customer.setWebsite(request.getWebsite());
        if (request.getIndustry() != null) customer.setIndustry(request.getIndustry());
        if (request.getCustomerTier() != null) customer.setCustomerTier(request.getCustomerTier());
        if (request.getCustomerStatus() != null) customer.setCustomerStatus(request.getCustomerStatus());
        if (request.getAnnualRevenue() != null) customer.setAnnualRevenue(request.getAnnualRevenue());
        customer.setBillingAddress(request.getBillingAddress());
        customer.setNotes(request.getNotes());
        customer.setAssignedAccountManagerId(request.getAssignedAccountManagerId());
        customer.setAssignedAccountManagerName(request.getAssignedAccountManagerName());

        Customer saved = customerRepository.save(customer);
        log.info("Updated customer account '{}' (id: {})", saved.getName(), saved.getId());
        return CustomerResponse.fromEntity(saved);
    }

    private String validateAndCleanPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }
        String clean = phone.trim().replaceAll("[\\s\\-\\(\\)\\+]", "");
        if (clean.startsWith("91") && clean.length() == 12) {
            clean = clean.substring(2);
        }
        if (!clean.matches("^\\d{10}$")) {
            throw new IllegalArgumentException("Phone number must be exactly 10 digits (e.g. 9876543210).");
        }
        return clean;
    }

    @Transactional
    public CustomerResponse updateCustomerStatus(Long id, CustomerStatus newStatus) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setCustomerStatus(newStatus);
        Customer saved = customerRepository.save(customer);
        log.info("Updated customer status to {} for id {}", newStatus, id);
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public CustomerResponse assignAccountManager(Long id, Long managerId, String managerName) {
        return assignAccountManager(id, managerId, managerName, null, null, null);
    }

    @Transactional
    public CustomerResponse assignAccountManager(
            Long id,
            Long managerId,
            String managerName,
            Long currentUserId,
            String currentUserName,
            String currentUserRole
    ) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        // If user is Employee:
        if ("ROLE_EMPLOYEE".equalsIgnoreCase(currentUserRole)) {
            // If already assigned to someone else, Employee cannot reassign
            if (customer.getAssignedAccountManagerId() != null &&
                    !customer.getAssignedAccountManagerId().equals(currentUserId)) {
                throw new IllegalArgumentException("This customer account is already assigned to another manager. Only Admin or Department Managers can reassign.");
            }
            // If claiming or assigning an unassigned customer, assign to current employee
            if (managerId == null || !managerId.equals(currentUserId)) {
                managerId = currentUserId;
                managerName = currentUserName;
            }
        }

        customer.setAssignedAccountManagerId(managerId);
        customer.setAssignedAccountManagerName(managerName);
        Customer saved = customerRepository.save(customer);
        log.info("Assigned account manager {} (id: {}) to customer id {} by {} ({})",
                managerName, managerId, id, currentUserName, currentUserRole);
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteCustomer(Long id, Long deletedByUserId, String deletedByUserName, String deletedByRole, String reason) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setIsDeleted(true);
        customer.setDeletedAt(LocalDateTime.now());
        customer.setDeletedByUserId(deletedByUserId);
        customer.setDeletedByUserName(deletedByUserName);
        customer.setDeletedByRole(deletedByRole);
        customer.setDeleteRequested(true);
        customer.setDeleteRequestReason(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Requested deletion by " + deletedByUserName);

        customerRepository.save(customer);
        log.info("Soft-deleted customer id {} by {} ({})", id, deletedByUserName, deletedByRole);
    }

    @Transactional
    public CustomerResponse restoreCustomer(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + id));

        customer.setIsDeleted(false);
        customer.setDeletedAt(null);
        customer.setDeletedByUserId(null);
        customer.setDeletedByUserName(null);
        customer.setDeletedByRole(null);
        customer.setDeleteRequested(false);
        customer.setDeleteRequestReason(null);

        Customer saved = customerRepository.save(customer);
        log.info("Restored customer account '{}' (id: {})", saved.getName(), saved.getId());
        return CustomerResponse.fromEntity(saved);
    }

    @Transactional
    public void permanentlyDeleteCustomer(Long id) {
        if (!customerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Customer not found with id: " + id);
        }
        customerRepository.deleteById(id);
        log.info("Permanently deleted customer with id {}", id);
    }

    @Transactional(readOnly = true)
    public CustomerStatsResponse getCustomerStats() {
        long totalCustomers = customerRepository.countByIsDeletedFalse();
        long activeCustomers = customerRepository.countByCustomerStatusAndIsDeletedFalse(CustomerStatus.ACTIVE);
        long onboardingCustomers = customerRepository.countByCustomerStatusAndIsDeletedFalse(CustomerStatus.ONBOARDING);
        long atRiskCustomers = customerRepository.countByCustomerStatusAndIsDeletedFalse(CustomerStatus.AT_RISK);
        long churnedCustomers = customerRepository.countByCustomerStatusAndIsDeletedFalse(CustomerStatus.CHURNED);
        long trashCount = customerRepository.countByIsDeletedTrue();

        BigDecimal totalArr = customerRepository.calculateTotalAnnualRevenue();
        BigDecimal activeArr = customerRepository.calculateTotalActiveAnnualRevenue();

        double retentionRate = 100.0;
        if (totalCustomers > 0) {
            retentionRate = Math.round(((double) (totalCustomers - churnedCustomers) / totalCustomers) * 1000.0) / 10.0;
        }

        Map<String, Long> byTier = new LinkedHashMap<>();
        for (CustomerTier tier : CustomerTier.values()) {
            byTier.put(tier.name(), customerRepository.countByCustomerTierAndIsDeletedFalse(tier));
        }

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (CustomerStatus status : CustomerStatus.values()) {
            byStatus.put(status.name(), customerRepository.countByCustomerStatusAndIsDeletedFalse(status));
        }

        Map<String, Long> byIndustry = new LinkedHashMap<>();
        for (Industry ind : Industry.values()) {
            byIndustry.put(ind.name(), 0L);
        }

        List<Customer> nonDeletedCustomers = customerRepository.searchCustomers(null, null, null, null, null, false);
        for (Customer c : nonDeletedCustomers) {
            if (c.getIndustry() != null) {
                byIndustry.put(c.getIndustry().name(), byIndustry.getOrDefault(c.getIndustry().name(), 0L) + 1L);
            }
        }

        return CustomerStatsResponse.builder()
                .totalCustomers(totalCustomers)
                .activeCustomers(activeCustomers)
                .onboardingCustomers(onboardingCustomers)
                .atRiskCustomers(atRiskCustomers)
                .churnedCustomers(churnedCustomers)
                .trashCustomersCount(trashCount)
                .totalAnnualRevenue(totalArr != null ? totalArr : BigDecimal.ZERO)
                .activeAnnualRevenue(activeArr != null ? activeArr : BigDecimal.ZERO)
                .retentionRate(retentionRate)
                .customersByTier(byTier)
                .customersByIndustry(byIndustry)
                .customersByStatus(byStatus)
                .build();
    }

    @Transactional(readOnly = true)
    public List<CustomerProductDTO> getCustomerProducts(Long customerId) {
        return customerProductRepository.findByCustomerIdOrderByPurchaseDateDesc(customerId)
                .stream()
                .map(cp -> CustomerProductDTO.builder()
                        .id(cp.getId())
                        .customerId(cp.getCustomerId())
                        .productId(cp.getProductId())
                        .productName(cp.getProductName())
                        .dealId(cp.getDealId())
                        .quantity(cp.getQuantity())
                        .unitPrice(cp.getUnitPrice())
                        .totalAmount(cp.getTotalAmount())
                        .status(cp.getStatus())
                        .purchaseDate(cp.getPurchaseDate())
                        .startDate(cp.getStartDate())
                        .expiryDate(cp.getExpiryDate())
                        .billingFrequency(cp.getBillingFrequency())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public CustomerProductDTO assignProductToCustomer(Long customerId, AssignCustomerProductRequest request) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + customerId));

        String prodName = request.getProductName();
        BigDecimal unitPrice = request.getUnitPrice();
        String billingFreq = request.getBillingFrequency();

        if (prodName == null || prodName.trim().isEmpty() || unitPrice == null) {
            try {
                var pData = jdbcTemplate.queryForMap("SELECT name, unit_price, billing_frequency FROM crm_products WHERE id = ?", request.getProductId());
                if (prodName == null || prodName.trim().isEmpty()) prodName = (String) pData.get("name");
                if (unitPrice == null && pData.get("unit_price") != null) unitPrice = (BigDecimal) pData.get("unit_price");
                if (billingFreq == null && pData.get("billing_frequency") != null) billingFreq = (String) pData.get("billing_frequency");
            } catch (Exception ignored) {}
        }
        if (prodName == null) prodName = "Product #" + request.getProductId();
        if (unitPrice == null) unitPrice = BigDecimal.ZERO;
        if (billingFreq == null) billingFreq = "ONE_TIME";

        int qty = request.getQuantity() != null && request.getQuantity() > 0 ? request.getQuantity() : 1;
        BigDecimal totalAmount = request.getTotalAmount() != null ? request.getTotalAmount() : unitPrice.multiply(BigDecimal.valueOf(qty));

        java.time.LocalDate startDate = request.getStartDate() != null ? request.getStartDate() : java.time.LocalDate.now();
        java.time.LocalDate expiryDate = request.getExpiryDate();
        if (expiryDate == null) {
            if ("MONTHLY".equalsIgnoreCase(billingFreq)) expiryDate = startDate.plusMonths(1);
            else if ("ANNUALLY".equalsIgnoreCase(billingFreq)) expiryDate = startDate.plusYears(1);
        }

        CustomerProduct cp = CustomerProduct.builder()
                .customerId(customerId)
                .productId(request.getProductId())
                .productName(prodName)
                .quantity(qty)
                .unitPrice(unitPrice)
                .totalAmount(totalAmount)
                .status(request.getStatus() != null ? request.getStatus() : "ACTIVE")
                .purchaseDate(java.time.LocalDate.now())
                .startDate(startDate)
                .expiryDate(expiryDate)
                .billingFrequency(billingFreq)
                .build();

        CustomerProduct saved = customerProductRepository.save(cp);

        // Deduct inventory stock if product tracks stock in crm_products
        if (request.getProductId() != null && qty > 0) {
            try {
                jdbcTemplate.update(
                        "UPDATE crm_products SET stock_quantity = GREATEST(0, stock_quantity - ?), " +
                        "status = CASE WHEN stock_quantity - ? <= 0 THEN 'OUT_OF_STOCK' ELSE status END " +
                        "WHERE id = ? AND stock_quantity IS NOT NULL",
                        qty, qty, request.getProductId()
                );
                log.info("Deducted {} units from product ID {} stock for customer ID {}", qty, request.getProductId(), customerId);
            } catch (Exception e) {
                log.warn("Could not deduct inventory stock for product ID {}: {}", request.getProductId(), e.getMessage());
            }
        }

        // Update customer's annual revenue
        BigDecimal currentRev = customer.getAnnualRevenue() != null ? customer.getAnnualRevenue() : BigDecimal.ZERO;
        customer.setAnnualRevenue(currentRev.add(totalAmount));
        customer.setCustomerStatus(CustomerStatus.ACTIVE);
        customerRepository.save(customer);

        return CustomerProductDTO.builder()
                .id(saved.getId())
                .customerId(saved.getCustomerId())
                .productId(saved.getProductId())
                .productName(saved.getProductName())
                .quantity(saved.getQuantity())
                .unitPrice(saved.getUnitPrice())
                .totalAmount(saved.getTotalAmount())
                .status(saved.getStatus())
                .purchaseDate(saved.getPurchaseDate())
                .startDate(saved.getStartDate())
                .expiryDate(saved.getExpiryDate())
                .billingFrequency(saved.getBillingFrequency())
                .build();
    }

    @Transactional
    public void deleteCustomerProduct(Long customerId, Long customerProductId) {
        CustomerProduct cp = customerProductRepository.findById(customerProductId).orElse(null);
        if (cp != null) {
            // Restore inventory stock in crm_products
            if (cp.getProductId() != null && cp.getQuantity() != null && cp.getQuantity() > 0) {
                try {
                    jdbcTemplate.update(
                            "UPDATE crm_products SET stock_quantity = stock_quantity + ?, " +
                            "status = CASE WHEN status = 'OUT_OF_STOCK' AND stock_quantity + ? > 0 THEN 'ACTIVE' ELSE status END " +
                            "WHERE id = ? AND stock_quantity IS NOT NULL",
                            cp.getQuantity(), cp.getQuantity(), cp.getProductId()
                    );
                    log.info("Restored {} units to product ID {} stock on customer product deletion", cp.getQuantity(), cp.getProductId());
                } catch (Exception e) {
                    log.warn("Could not restore inventory stock for product ID {}: {}", cp.getProductId(), e.getMessage());
                }
            }

            // Adjust customer's annual revenue
            if (cp.getTotalAmount() != null) {
                customerRepository.findById(customerId).ifPresent(c -> {
                    BigDecimal current = c.getAnnualRevenue() != null ? c.getAnnualRevenue() : BigDecimal.ZERO;
                    c.setAnnualRevenue(current.subtract(cp.getTotalAmount()).max(BigDecimal.ZERO));
                    customerRepository.save(c);
                });
            }

            customerProductRepository.delete(cp);
        }
    }
}
