package com.crm.pipeline.service;

import com.crm.pipeline.model.Deal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DealClosedWonSyncService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * Executes downstream synchronization when a deal reaches CLOSED_WON:
     * 1. Customer Accounts sync (create or upgrade to ACTIVE with deal revenue)
     * 2. Lead conversion sync (update lead status to CONVERTED, link customer ID)
     * 3. Contacts & Stakeholders sync (relink contacts to active customer, activate status)
     * 4. Auto-generate onboarding task in Tasks & Activities (assigned to deal owner)
     */
    @Transactional
    public Long syncDealClosedWon(Deal deal) {
        if (deal == null) return null;

        log.info("🚀 Initiating automated downstream sync for CLOSED WON deal: '{}' (ID: {}, Value: ₹{})",
                deal.getDealName(), deal.getId(), deal.getAmount());

        try {
            // Step 1: Customer Account Provisioning or Upgrading
            Long customerId = syncCustomerAccount(deal);

            // Step 1.1: Sync Purchased Products to Customer Account
            if (customerId != null) {
                syncCustomerPurchasedProducts(deal, customerId);
            }

            // Step 2: Lead Conversion Sync
            if (deal.getLeadId() != null) {
                syncLeadConversion(deal.getLeadId(), customerId);
            }

            // Step 3: Contacts & Stakeholders Sync
            if (customerId != null) {
                syncContactsAndStakeholders(deal, customerId);
            }

            // Step 4: Auto-Generate Onboarding Task
            if (customerId != null) {
                createOnboardingTaskIfAbsent(deal, customerId);
            }

            log.info("✅ Downstream sync for CLOSED WON deal ID {} completed successfully. Linked Customer ID: {}",
                    deal.getId(), customerId);

            return customerId;
        } catch (Exception e) {
            log.error("❌ Error during downstream sync for Closed Won deal ID {}: {}", deal.getId(), e.getMessage(), e);
            return deal.getCustomerId();
        }
    }

    /**
     * Ensures an ACTIVE customer account exists for this deal.
     * Updates annual revenue and status, or inserts a new record if absent.
     */
    private Long syncCustomerAccount(Deal deal) {
        Long customerId = deal.getCustomerId();
        String customerName = deal.getCustomerName() != null ? deal.getCustomerName().trim() : null;
        BigDecimal dealValue = deal.getAmount() != null ? deal.getAmount() : BigDecimal.ZERO;

        // Case A: Deal already has a linked customerId
        if (customerId != null) {
            List<Map<String, Object>> existingList = jdbcTemplate.queryForList(
                    "SELECT id, name, customer_status, annual_revenue, is_deleted FROM crm_customers WHERE id = ?",
                    customerId
            );

            if (!existingList.isEmpty()) {
                Map<String, Object> cust = existingList.get(0);
                BigDecimal currentRev = cust.get("annual_revenue") != null ? (BigDecimal) cust.get("annual_revenue") : BigDecimal.ZERO;
                BigDecimal updatedRev = currentRev.add(dealValue);

                jdbcTemplate.update(
                        "UPDATE crm_customers SET customer_status = 'ACTIVE', annual_revenue = ?, is_deleted = false, deleted_at = null, updated_at = NOW() WHERE id = ?",
                        updatedRev, customerId
                );

                log.info("Upgraded existing customer ID {} ('{}') to ACTIVE with updated revenue: ₹{}",
                        customerId, cust.get("name"), updatedRev);
                return customerId;
            }
        }

        // Case B: Look up by converted_from_lead_id if deal has a leadId
        if (deal.getLeadId() != null) {
            List<Long> custIdsByLead = jdbcTemplate.query(
                    "SELECT id FROM crm_customers WHERE converted_from_lead_id = ? AND is_deleted = false LIMIT 1",
                    (rs, rowNum) -> rs.getLong("id"),
                    deal.getLeadId()
            );

            if (!custIdsByLead.isEmpty()) {
                Long foundId = custIdsByLead.get(0);
                jdbcTemplate.update(
                        "UPDATE crm_customers SET customer_status = 'ACTIVE', annual_revenue = COALESCE(annual_revenue, 0) + ?, updated_at = NOW() WHERE id = ?",
                        dealValue, foundId
                );
                log.info("Found customer ID {} via lead ID {}. Updated to ACTIVE.", foundId, deal.getLeadId());
                return foundId;
            }
        }

        // Case C: Look up by Company / Customer Name match
        if (customerName != null && !customerName.isEmpty()) {
            List<Long> custIdsByName = jdbcTemplate.query(
                    "SELECT id FROM crm_customers WHERE (LOWER(name) = LOWER(?) OR LOWER(company) = LOWER(?)) AND is_deleted = false LIMIT 1",
                    (rs, rowNum) -> rs.getLong("id"),
                    customerName, customerName
            );

            if (!custIdsByName.isEmpty()) {
                Long foundId = custIdsByName.get(0);
                jdbcTemplate.update(
                        "UPDATE crm_customers SET customer_status = 'ACTIVE', annual_revenue = COALESCE(annual_revenue, 0) + ?, updated_at = NOW() WHERE id = ?",
                        dealValue, foundId
                );
                log.info("Found customer ID {} by company name '{}'. Updated to ACTIVE.", foundId, customerName);
                return foundId;
            }
        }

        // Case D: Auto-create a brand new Customer Account
        return createNewCustomerAccount(deal);
    }

    /**
     * Inserts a new active Customer Account into crm_customers based on Deal & linked Lead info.
     */
    private Long createNewCustomerAccount(Deal deal) {
        String companyName = deal.getCustomerName();
        String contactPerson = "Primary Stakeholder";
        String email = null;
        String phone = null;

        // If deal has linked lead, extract lead contact details
        if (deal.getLeadId() != null) {
            List<Map<String, Object>> leadRows = jdbcTemplate.queryForList(
                    "SELECT first_name, last_name, email, phone, company FROM crm_leads WHERE id = ?",
                    deal.getLeadId()
            );

            if (!leadRows.isEmpty()) {
                Map<String, Object> leadData = leadRows.get(0);
                String fn = (String) leadData.get("first_name");
                String ln = (String) leadData.get("last_name");
                contactPerson = ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim();
                email = (String) leadData.get("email");
                phone = (String) leadData.get("phone");
                String leadCompany = (String) leadData.get("company");
                if (companyName == null || companyName.trim().isEmpty()) {
                    companyName = leadCompany;
                }
            }
        }

        // Fallback names if still null
        if (companyName == null || companyName.trim().isEmpty()) {
            companyName = deal.getDealName() + " Account";
        }
        if (email == null || email.trim().isEmpty()) {
            String sanitized = companyName.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
            email = "contact@" + (sanitized.isEmpty() ? "company" : sanitized) + ".com";
        }

        BigDecimal initialRevenue = deal.getAmount() != null ? deal.getAmount() : BigDecimal.ZERO;
        String tier = initialRevenue.compareTo(BigDecimal.valueOf(1000000)) >= 0 ? "TIER_1_ENTERPRISE" :
                (initialRevenue.compareTo(BigDecimal.valueOf(250000)) >= 0 ? "TIER_2_MID_MARKET" : "TIER_3_SMB");

        String insertSql = """
                INSERT INTO crm_customers (
                    name, contact_person, email, phone, company,
                    customer_status, customer_tier, industry, annual_revenue,
                    assigned_account_manager_id, assigned_account_manager_name,
                    converted_from_lead_id, is_deleted, delete_requested, notes,
                    created_at, updated_at
                ) VALUES (
                    ?, ?, ?, ?, ?,
                    'ACTIVE', ?, 'TECHNOLOGY', ?,
                    ?, ?,
                    ?, false, false, ?,
                    NOW(), NOW()
                ) RETURNING id
                """;

        String notes = "Auto-created on Deal Closed Won: " + deal.getDealName();

        Long newId = jdbcTemplate.queryForObject(
                insertSql,
                Long.class,
                companyName,
                contactPerson,
                email,
                phone,
                companyName,
                tier,
                initialRevenue,
                deal.getAssignedToUserId(),
                deal.getAssignedToUserName(),
                deal.getLeadId(),
                notes
        );

        log.info("Created new ACTIVE Customer Account ID {} ('{}') with contract revenue ₹{}",
                newId, companyName, initialRevenue);

        return newId;
    }

    /**
     * Updates linked lead status to CONVERTED and timestamps conversion.
     */
    private void syncLeadConversion(Long leadId, Long customerId) {
        try {
            int updated = jdbcTemplate.update(
                    "UPDATE crm_leads SET lead_status = 'CONVERTED', converted_customer_id = ?, converted_at = COALESCE(converted_at, NOW()), updated_at = NOW() WHERE id = ?",
                    customerId, leadId
            );
            if (updated > 0) {
                log.info("Lead ID {} linked to Customer ID {}", leadId, customerId);
            }
        } catch (Exception e) {
            log.warn("Could not update lead ID {}: {}", leadId, e.getMessage());
        }
    }

    /**
     * Relinks and updates status of contacts for the active customer account.
     */
    private void syncContactsAndStakeholders(Deal deal, Long customerId) {
        try {
            String customerName = deal.getCustomerName();

            // Link any dangling contacts that match customer name or were linked to this deal
            if (customerName != null && !customerName.trim().isEmpty()) {
                int linked = jdbcTemplate.update(
                        "UPDATE crm_contacts SET customer_id = ?, customer_name = ?, status = 'ACTIVE', is_archived = false, updated_at = NOW() " +
                        "WHERE customer_id IS NULL AND LOWER(customer_name) = LOWER(?)",
                        customerId, customerName, customerName.trim()
                );
                if (linked > 0) {
                    log.info("Relinked {} dangling contacts to Customer ID {} ('{}')", linked, customerId, customerName);
                }
            }

            // Ensure all existing contacts under this customer account are marked ACTIVE
            jdbcTemplate.update(
                    "UPDATE crm_contacts SET status = 'ACTIVE', is_archived = false, updated_at = NOW() WHERE customer_id = ? AND status != 'ACTIVE'",
                    customerId
            );
        } catch (Exception e) {
            log.warn("Could not sync contacts for Customer ID {}: {}", customerId, e.getMessage());
        }
    }

    /**
     * Creates an onboarding kickoff task in crm_tasks if one does not already exist.
     */
    private void createOnboardingTaskIfAbsent(Deal deal, Long customerId) {
        try {
            String customerName = deal.getCustomerName() != null ? deal.getCustomerName() : "Customer";

            // Check if onboarding task already exists for this customer (Idempotency)
            List<Long> existingTasks = jdbcTemplate.query(
                    "SELECT id FROM crm_tasks WHERE is_deleted = false AND related_entity_type = 'CUSTOMER' AND related_entity_id = ? AND title LIKE 'Kick off onboarding%' LIMIT 1",
                    (rs, rowNum) -> rs.getLong("id"),
                    customerId
            );

            if (!existingTasks.isEmpty()) {
                log.info("Onboarding task already exists for Customer ID {} (Task ID: {}). Skipping duplicate creation.",
                        customerId, existingTasks.get(0));
                return;
            }

            String title = "Kick off onboarding for " + customerName;
            String description = String.format(
                    "Deal '%s' was Closed Won with contract value ₹%s. Initiate client onboarding kickoff, welcome stakeholder handover, and provisioning setup.",
                    deal.getDealName(),
                    deal.getAmount() != null ? deal.getAmount().toPlainString() : "0"
            );

            LocalDate dueDate = LocalDate.now().plusDays(3);

            String insertTaskSql = """
                    INSERT INTO crm_tasks (
                        title, description, task_type, priority, status,
                        due_date, assigned_to_user_id, assigned_to_user_name,
                        related_entity_type, related_entity_id, related_entity_name,
                        created_by_user_id, created_by_user_name, created_by_role,
                        is_deleted, created_at, updated_at
                    ) VALUES (
                        ?, ?, 'FOLLOW_UP', 'HIGH', 'TODO',
                        ?, ?, ?,
                        'CUSTOMER', ?, ?,
                        ?, ?, 'SYSTEM',
                        false, NOW(), NOW()
                    )
                    """;

            jdbcTemplate.update(
                    insertTaskSql,
                    title,
                    description,
                    dueDate,
                    deal.getAssignedToUserId(),
                    deal.getAssignedToUserName(),
                    customerId,
                    customerName,
                    deal.getAssignedToUserId(),
                    deal.getAssignedToUserName()
            );

            log.info("Created onboarding task: '{}' assigned to {} (due {})",
                    title, deal.getAssignedToUserName() != null ? deal.getAssignedToUserName() : "Rep", dueDate);
        } catch (Exception e) {
            log.warn("Could not create onboarding task for Deal ID {}: {}", deal.getId(), e.getMessage());
        }
    }

    /**
     * Synchronizes all deal products from crm_deal_products into crm_customer_products.
     */
    private void syncCustomerPurchasedProducts(Deal deal, Long customerId) {
        if (deal == null || customerId == null) return;
        try {
            List<Map<String, Object>> dealProducts = jdbcTemplate.queryForList(
                "SELECT product_id, product_name, quantity, unit_price, total_price FROM crm_deal_products WHERE deal_id = ?",
                deal.getId()
            );

            for (Map<String, Object> dp : dealProducts) {
                Long productId = ((Number) dp.get("product_id")).longValue();
                String productName = (String) dp.get("product_name");
                Integer quantity = ((Number) dp.get("quantity")).intValue();
                BigDecimal unitPrice = (BigDecimal) dp.get("unit_price");
                BigDecimal totalAmount = (BigDecimal) dp.get("total_price");

                String billingFreq = "ONE_TIME";
                try {
                    String freq = jdbcTemplate.queryForObject("SELECT billing_frequency FROM crm_products WHERE id = ?", String.class, productId);
                    if (freq != null) billingFreq = freq;
                } catch (Exception ignored) {}

                LocalDate startDate = LocalDate.now();
                LocalDate expiryDate = null;
                if ("MONTHLY".equalsIgnoreCase(billingFreq)) {
                    expiryDate = startDate.plusMonths(1);
                } else if ("ANNUALLY".equalsIgnoreCase(billingFreq)) {
                    expiryDate = startDate.plusYears(1);
                }

                jdbcTemplate.update("""
                    INSERT INTO crm_customer_products (
                        customer_id, product_id, product_name, deal_id, quantity, unit_price, total_amount, status, purchase_date, start_date, expiry_date, billing_frequency, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', CURRENT_DATE, ?, ?, ?, NOW(), NOW())
                """, customerId, productId, productName, deal.getId(), quantity, unitPrice, totalAmount, startDate, expiryDate, billingFreq);

                // Deduct inventory stock if physical product has stock tracking in crm_products
                if (productId != null && quantity != null && quantity > 0) {
                    try {
                        jdbcTemplate.update(
                                "UPDATE crm_products SET stock_quantity = GREATEST(0, stock_quantity - ?), " +
                                "status = CASE WHEN stock_quantity - ? <= 0 THEN 'OUT_OF_STOCK' ELSE status END " +
                                "WHERE id = ? AND stock_quantity IS NOT NULL",
                                quantity, quantity, productId
                        );
                        log.info("Deducted {} units from product ID {} stock for Closed Won deal ID {}", quantity, productId, deal.getId());
                    } catch (Exception ex) {
                        log.warn("Could not deduct stock for product ID {}: {}", productId, ex.getMessage());
                    }
                }
            }
            log.info("Synced {} purchased products to customer ID {} for Closed Won deal ID {}",
                    dealProducts.size(), customerId, deal.getId());
        } catch (Exception e) {
            log.error("Failed to sync purchased products for deal ID {}: {}", deal.getId(), e.getMessage());
        }
    }
}
