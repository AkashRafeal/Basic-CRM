package com.crm.lead.service;

import com.crm.lead.dto.*;
import com.crm.lead.model.Lead;
import com.crm.lead.model.LeadSource;
import com.crm.lead.model.LeadStatus;
import com.crm.lead.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LeadService {

    private final LeadRepository leadRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @jakarta.annotation.PostConstruct
    public void initDb() {
        try {
            jdbcTemplate.execute("ALTER TABLE crm_leads ALTER COLUMN last_name DROP NOT NULL");
        } catch (Exception ignored) {}
    }

    public List<LeadProductDTO> getInterestedProductsForLead(Long leadId) {
        if (leadId == null) return java.util.Collections.emptyList();
        try {
            String sql = """
                SELECT lp.product_id, p.name, p.sku, p.category, p.unit_price, p.status, p.is_physical
                FROM crm_lead_products lp
                JOIN crm_products p ON lp.product_id = p.id
                WHERE lp.lead_id = ?
            """;
            return jdbcTemplate.query(sql, (rs, rowNum) -> LeadProductDTO.builder()
                    .productId(rs.getLong("product_id"))
                    .name(rs.getString("name"))
                    .sku(rs.getString("sku"))
                    .category(rs.getString("category"))
                    .unitPrice(rs.getBigDecimal("unit_price"))
                    .status(rs.getString("status"))
                    .isPhysical(rs.getBoolean("is_physical"))
                    .build(), leadId);
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    private void syncInterestedProducts(Long leadId, List<Long> productIds) {
        if (leadId == null || productIds == null) return;
        try {
            jdbcTemplate.update("DELETE FROM crm_lead_products WHERE lead_id = ?", leadId);
            for (Long pId : productIds) {
                if (pId != null) {
                    jdbcTemplate.update(
                        "INSERT INTO crm_lead_products (lead_id, product_id, created_at) VALUES (?, ?, NOW()) ON CONFLICT DO NOTHING",
                        leadId, pId
                    );
                }
            }
        } catch (Exception e) {
            // ignore
        }
    }

    @Transactional
    public LeadResponse createLead(CreateLeadRequest request) {
        String cleanPhone = validateAndCleanPhone(request.getPhone());

        Lead lead = Lead.builder()
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName() != null ? request.getLastName().trim() : "")
                .email(request.getEmail().trim().toLowerCase())
                .phone(cleanPhone)
                .company(request.getCompany())
                .jobTitle(request.getJobTitle())
                .leadStatus(request.getLeadStatus() != null ? request.getLeadStatus() : LeadStatus.NEW)
                .leadSource(request.getLeadSource() != null ? request.getLeadSource() : LeadSource.WEBSITE)
                .estimatedValue(request.getEstimatedValue() != null ? request.getEstimatedValue() : BigDecimal.ZERO)
                .score(request.getScore() != null ? request.getScore() : 50)
                .notes(request.getNotes())
                .assignedToUserId(request.getAssignedToUserId())
                .assignedToUserName(request.getAssignedToUserName())
                .isArchived(false)
                .build();

        Lead saved = leadRepository.save(lead);

        if (request.getInterestedProductIds() != null && !request.getInterestedProductIds().isEmpty()) {
            syncInterestedProducts(saved.getId(), request.getInterestedProductIds());
        }

        if (saved.getLeadStatus() == LeadStatus.CONVERTED) {
            Long dealId = autoCreateOrLinkPipelineDeal(saved);
            saved.setConvertedDealId(dealId);
            saved.setConvertedAt(java.time.LocalDateTime.now());
            saved = leadRepository.save(saved);
        }

        return LeadResponse.fromEntity(saved, getInterestedProductsForLead(saved.getId()));
    }

    @Transactional(readOnly = true)
    public List<LeadResponse> getAllLeads(String search, LeadStatus status, LeadSource source, Long assignedUserId) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return leadRepository.searchLeads(cleanSearch, status, source, assignedUserId)
                .stream()
                .map(l -> LeadResponse.fromEntity(l, getInterestedProductsForLead(l.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeadResponse getLeadById(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found with id: " + id));
        return LeadResponse.fromEntity(lead, getInterestedProductsForLead(lead.getId()));
    }

    @Transactional
    public LeadResponse updateLead(Long id, UpdateLeadRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found with id: " + id));

        lead.setFirstName(request.getFirstName().trim());
        lead.setLastName(request.getLastName() != null ? request.getLastName().trim() : "");
        lead.setEmail(request.getEmail().trim().toLowerCase());
        lead.setPhone(validateAndCleanPhone(request.getPhone()));
        lead.setCompany(request.getCompany());
        lead.setJobTitle(request.getJobTitle());

        boolean becomingConverted = request.getLeadStatus() == LeadStatus.CONVERTED && lead.getLeadStatus() != LeadStatus.CONVERTED;
        if (request.getLeadStatus() != null) lead.setLeadStatus(request.getLeadStatus());
        if (request.getLeadSource() != null) lead.setLeadSource(request.getLeadSource());
        if (request.getEstimatedValue() != null) lead.setEstimatedValue(request.getEstimatedValue());
        if (request.getScore() != null) lead.setScore(request.getScore());
        lead.setNotes(request.getNotes());
        if (request.getAssignedToUserId() != null) lead.setAssignedToUserId(request.getAssignedToUserId());
        if (request.getAssignedToUserName() != null) lead.setAssignedToUserName(request.getAssignedToUserName());

        if (request.getInterestedProductIds() != null) {
            syncInterestedProducts(lead.getId(), request.getInterestedProductIds());
        }

        if (lead.getLeadStatus() == LeadStatus.CONVERTED) {
            Long dealId = autoCreateOrLinkPipelineDeal(lead);
            lead.setConvertedDealId(dealId);
            lead.setConvertedAt(java.time.LocalDateTime.now());
        }

        Lead updated = leadRepository.save(lead);
        LeadResponse response = LeadResponse.fromEntity(updated, getInterestedProductsForLead(updated.getId()));
        response.setConvertedDealCreated(becomingConverted);
        return response;
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
    public LeadResponse updateLeadStatus(Long id, UpdateLeadStatusRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found with id: " + id));

        boolean becomingConverted = request.getLeadStatus() == LeadStatus.CONVERTED;
        if (becomingConverted) {
            Long dealId = autoCreateOrLinkPipelineDeal(lead);
            lead.setConvertedDealId(dealId);
            lead.setConvertedAt(java.time.LocalDateTime.now());
        }

        lead.setLeadStatus(request.getLeadStatus());
        Lead updated = leadRepository.save(lead);
        LeadResponse response = LeadResponse.fromEntity(updated);
        response.setConvertedDealCreated(becomingConverted);
        return response;
    }

    @Transactional
    public LeadResponse assignLead(Long id, AssignLeadRequest request) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found with id: " + id));

        lead.setAssignedToUserId(request.getAssignedToUserId());
        lead.setAssignedToUserName(request.getAssignedToUserName());
        Lead updated = leadRepository.save(lead);
        return LeadResponse.fromEntity(updated);
    }

    @Transactional
    public LeadResponse convertLead(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found with id: " + id));

        Long dealId = autoCreateOrLinkPipelineDeal(lead);
        lead.setConvertedDealId(dealId);
        lead.setConvertedAt(java.time.LocalDateTime.now());
        lead.setLeadStatus(LeadStatus.CONVERTED);
        Lead updated = leadRepository.save(lead);
        LeadResponse response = LeadResponse.fromEntity(updated);
        response.setConvertedDealCreated(true);
        return response;
    }

    private Long autoCreateOrLinkPipelineDeal(Lead lead) {
        // Ensure table column exists if Hibernate hasn't updated yet
        try {
            jdbcTemplate.execute("ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS converted_deal_id BIGINT");
        } catch (Exception ignored) {}

        // 1. Check if linked deal already exists for this lead
        List<Long> existingDealIds = jdbcTemplate.query(
                "SELECT id FROM crm_deals WHERE lead_id = ? LIMIT 1",
                (rs, rowNum) -> rs.getLong("id"),
                lead.getId()
        );

        if (!existingDealIds.isEmpty()) {
            return existingDealIds.get(0);
        }

        // 2. Create a brand new Opportunity / Deal in Sales Pipeline
        String dealName = (lead.getCompany() != null && !lead.getCompany().trim().isEmpty())
                ? lead.getCompany().trim() + " - Opportunity"
                : lead.getFullName() + " - Opportunity";

        BigDecimal dealAmount = lead.getEstimatedValue() != null ? lead.getEstimatedValue() : BigDecimal.ZERO;
        BigDecimal expectedRevenue = dealAmount.multiply(new BigDecimal("10")).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        String customerName = (lead.getCompany() != null && !lead.getCompany().trim().isEmpty())
                ? lead.getCompany().trim()
                : lead.getFullName();

        String notes = (lead.getNotes() != null && !lead.getNotes().trim().isEmpty() ? lead.getNotes().trim() + " | " : "")
                + "Converted from Lead #" + lead.getId() + " (" + lead.getFullName() + ") - Source: " + lead.getLeadSource();

        String insertSql = """
            INSERT INTO crm_deals (
                deal_name, stage, amount, probability, expected_revenue, expected_close_date,
                deal_type, priority, customer_id, customer_name, lead_id,
                assigned_to_user_id, assigned_to_user_name, description, created_at, updated_at
            ) VALUES (?, 'QUALIFICATION', ?, 10, ?, CURRENT_DATE + INTERVAL '30 days', 'NEW_BUSINESS', 'MEDIUM', NULL, ?, ?, ?, ?, ?, NOW(), NOW())
            RETURNING id
        """;

        Long newDealId = jdbcTemplate.queryForObject(
                insertSql,
                Long.class,
                dealName,
                dealAmount,
                expectedRevenue,
                customerName,
                lead.getId(),
                lead.getAssignedToUserId(),
                lead.getAssignedToUserName(),
                notes
        );

        // 3. Transfer any interested products from crm_lead_products to crm_deal_products
        try {
            List<Map<String, Object>> interestedProds = jdbcTemplate.queryForList("""
                SELECT p.id AS product_id, p.name AS product_name, p.unit_price
                FROM crm_lead_products lp
                JOIN crm_products p ON lp.product_id = p.id
                WHERE lp.lead_id = ?
            """, lead.getId());

            for (Map<String, Object> prod : interestedProds) {
                Long pId = ((Number) prod.get("product_id")).longValue();
                String pName = (String) prod.get("product_name");
                BigDecimal uPrice = (BigDecimal) prod.get("unit_price");
                if (uPrice == null) uPrice = BigDecimal.ZERO;

                jdbcTemplate.update("""
                    INSERT INTO crm_deal_products (deal_id, product_id, product_name, quantity, unit_price, discount_amount, discount_percentage, total_price, created_at, updated_at)
                    VALUES (?, ?, ?, 1, ?, 0, 0, ?, NOW(), NOW())
                """, newDealId, pId, pName, uPrice, uPrice);
            }
        } catch (Exception ignored) {}

        return newDealId;
    }

    @Transactional
    public void deleteLead(Long id) {
        Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lead not found with id: " + id));

        leadRepository.delete(lead);
    }

    @Transactional(readOnly = true)
    public LeadStatsResponse getLeadStats() {
        long total = leadRepository.count();
        long newCount = leadRepository.countByLeadStatus(LeadStatus.NEW);
        long qualifiedCount = leadRepository.countByLeadStatus(LeadStatus.QUALIFIED);
        long convertedCount = leadRepository.countByLeadStatus(LeadStatus.CONVERTED);
        long lostCount = leadRepository.countByLeadStatus(LeadStatus.LOST);
        BigDecimal totalValue = leadRepository.calculateTotalPipelineValue();

        double conversionRate = total > 0 ? ((double) convertedCount / total) * 100.0 : 0.0;
        conversionRate = BigDecimal.valueOf(conversionRate).setScale(1, RoundingMode.HALF_UP).doubleValue();

        Map<String, Long> statusBreakdown = new HashMap<>();
        Arrays.stream(LeadStatus.values()).forEach(s -> 
            statusBreakdown.put(s.name(), leadRepository.countByLeadStatus(s))
        );

        List<Lead> allLeads = leadRepository.findAll();
        Map<String, Long> sourceBreakdown = allLeads.stream()
                .collect(Collectors.groupingBy(l -> l.getLeadSource().name(), Collectors.counting()));

        return LeadStatsResponse.builder()
                .totalLeads(total)
                .newLeads(newCount)
                .qualifiedLeads(qualifiedCount)
                .convertedLeads(convertedCount)
                .lostLeads(lostCount)
                .conversionRate(conversionRate)
                .totalPipelineValue(totalValue != null ? totalValue : BigDecimal.ZERO)
                .statusBreakdown(statusBreakdown)
                .sourceBreakdown(sourceBreakdown)
                .build();
    }
}
