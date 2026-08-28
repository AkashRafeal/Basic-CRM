package com.crm.pipeline.service;

import com.crm.pipeline.common.ResourceNotFoundException;
import com.crm.pipeline.dto.*;
import com.crm.pipeline.model.*;
import com.crm.pipeline.repository.DealRepository;
import com.crm.pipeline.repository.PipelineStageConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DealService {

    private final DealRepository dealRepository;
    private final PipelineStageConfigRepository stageConfigRepository;
    private final DealClosedWonSyncService dealClosedWonSyncService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public List<DealItemResponse> getDealItems(Long dealId) {
        if (dealId == null) return java.util.Collections.emptyList();
        try {
            String sql = """
                SELECT id, deal_id, product_id, product_name, quantity, unit_price, discount_amount, discount_percentage, total_price
                FROM crm_deal_products
                WHERE deal_id = ?
                ORDER BY id ASC
            """;
            return jdbcTemplate.query(sql, (rs, rowNum) -> DealItemResponse.builder()
                    .id(rs.getLong("id"))
                    .dealId(rs.getLong("deal_id"))
                    .productId(rs.getLong("product_id"))
                    .productName(rs.getString("product_name"))
                    .quantity(rs.getInt("quantity"))
                    .unitPrice(rs.getBigDecimal("unit_price"))
                    .discountAmount(rs.getBigDecimal("discount_amount"))
                    .discountPercentage(rs.getBigDecimal("discount_percentage"))
                    .totalPrice(rs.getBigDecimal("total_price"))
                    .build(), dealId);
        } catch (Exception e) {
            return java.util.Collections.emptyList();
        }
    }

    private void syncDealItems(Long dealId, List<DealItemRequest> items) {
        if (dealId == null || items == null) return;
        try {
            jdbcTemplate.update("DELETE FROM crm_deal_products WHERE deal_id = ?", dealId);
            for (DealItemRequest item : items) {
                if (item.getProductId() != null) {
                    int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
                    BigDecimal unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                    String prodName = item.getProductName();

                    if (prodName == null || prodName.trim().isEmpty() || unitPrice.compareTo(BigDecimal.ZERO) <= 0) {
                        try {
                            var prodData = jdbcTemplate.queryForMap("SELECT name, unit_price FROM crm_products WHERE id = ?", item.getProductId());
                            if (prodName == null || prodName.trim().isEmpty()) {
                                prodName = (String) prodData.get("name");
                            }
                            if (unitPrice.compareTo(BigDecimal.ZERO) <= 0 && prodData.get("unit_price") != null) {
                                unitPrice = (BigDecimal) prodData.get("unit_price");
                            }
                        } catch (Exception ignored) {}
                    }
                    if (prodName == null) prodName = "Product #" + item.getProductId();

                    BigDecimal discountAmt = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                    BigDecimal discountPct = item.getDiscountPercentage() != null ? item.getDiscountPercentage() : BigDecimal.ZERO;

                    BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(qty));
                    if (discountPct.compareTo(BigDecimal.ZERO) > 0 && discountAmt.compareTo(BigDecimal.ZERO) == 0) {
                        discountAmt = subtotal.multiply(discountPct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                    }
                    BigDecimal totalPrice = subtotal.subtract(discountAmt).max(BigDecimal.ZERO);

                    jdbcTemplate.update("""
                        INSERT INTO crm_deal_products (deal_id, product_id, product_name, quantity, unit_price, discount_amount, discount_percentage, total_price, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    """, dealId, item.getProductId(), prodName, qty, unitPrice, discountAmt, discountPct, totalPrice);
                }
            }
        } catch (Exception e) {
            log.error("Failed to sync deal products for deal ID {}: {}", dealId, e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<DealResponse> searchDeals(
            String search,
            DealStage stage,
            DealType dealType,
            DealPriority priority,
            Long assignedId
    ) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return dealRepository.searchDeals(cleanSearch, stage, dealType, priority, assignedId)
                .stream()
                .map(d -> DealResponse.fromEntity(d, getDealItems(d.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DealResponse getDealById(Long id) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found with id: " + id));
        return DealResponse.fromEntity(deal, getDealItems(deal.getId()));
    }

    @Transactional
    public DealResponse createDeal(CreateDealRequest request) {
        DealStage stage = request.getStage() != null ? request.getStage() : DealStage.QUALIFICATION;
        int defaultProb = stageConfigRepository.findByStage(stage)
                .map(PipelineStageConfig::getProbability)
                .orElse(stage.getDefaultProbability());
        int probability = request.getProbability() != null ? request.getProbability() : defaultProb;

        // Calculate amount from line items if provided and greater than 0
        BigDecimal dealAmount = request.getAmount();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            BigDecimal itemsTotal = BigDecimal.ZERO;
            for (DealItemRequest item : request.getItems()) {
                int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
                BigDecimal uPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal dAmt = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal dPct = item.getDiscountPercentage() != null ? item.getDiscountPercentage() : BigDecimal.ZERO;
                BigDecimal sub = uPrice.multiply(BigDecimal.valueOf(qty));
                if (dPct.compareTo(BigDecimal.ZERO) > 0 && dAmt.compareTo(BigDecimal.ZERO) == 0) {
                    dAmt = sub.multiply(dPct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                }
                itemsTotal = itemsTotal.add(sub.subtract(dAmt).max(BigDecimal.ZERO));
            }
            if (itemsTotal.compareTo(BigDecimal.ZERO) > 0) {
                dealAmount = itemsTotal;
            }
        }

        Deal deal = Deal.builder()
                .dealName(request.getDealName())
                .stage(stage)
                .amount(dealAmount != null ? dealAmount : BigDecimal.ZERO)
                .probability(probability)
                .expectedCloseDate(request.getExpectedCloseDate())
                .dealType(request.getDealType() != null ? request.getDealType() : DealType.NEW_BUSINESS)
                .priority(request.getPriority() != null ? request.getPriority() : DealPriority.MEDIUM)
                .customerId(request.getCustomerId())
                .customerName(request.getCustomerName())
                .leadId(request.getLeadId())
                .assignedToUserId(request.getAssignedToUserId())
                .assignedToUserName(request.getAssignedToUserName())
                .description(request.getDescription())
                .build();

        if (stage == DealStage.CLOSED_WON || stage == DealStage.CLOSED_LOST) {
            deal.setActualCloseDate(LocalDate.now());
        }

        Deal saved = dealRepository.save(deal);

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            syncDealItems(saved.getId(), request.getItems());
        }

        if (saved.getStage() == DealStage.CLOSED_WON) {
            Long customerId = dealClosedWonSyncService.syncDealClosedWon(saved);
            if (customerId != null && !customerId.equals(saved.getCustomerId())) {
                saved.setCustomerId(customerId);
                saved = dealRepository.save(saved);
            }
        }

        log.info("Created deal '{}' with amount ₹{} (id: {})", saved.getDealName(), saved.getAmount(), saved.getId());
        return DealResponse.fromEntity(saved, getDealItems(saved.getId()));
    }

    @Transactional
    public DealResponse updateDeal(Long id, UpdateDealRequest request) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found with id: " + id));

        DealStage previousStage = deal.getStage();

        deal.setDealName(request.getDealName());

        BigDecimal dealAmount = request.getAmount();
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            BigDecimal itemsTotal = BigDecimal.ZERO;
            for (DealItemRequest item : request.getItems()) {
                int qty = item.getQuantity() != null && item.getQuantity() > 0 ? item.getQuantity() : 1;
                BigDecimal uPrice = item.getUnitPrice() != null ? item.getUnitPrice() : BigDecimal.ZERO;
                BigDecimal dAmt = item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO;
                BigDecimal dPct = item.getDiscountPercentage() != null ? item.getDiscountPercentage() : BigDecimal.ZERO;
                BigDecimal sub = uPrice.multiply(BigDecimal.valueOf(qty));
                if (dPct.compareTo(BigDecimal.ZERO) > 0 && dAmt.compareTo(BigDecimal.ZERO) == 0) {
                    dAmt = sub.multiply(dPct).divide(BigDecimal.valueOf(100), 2, java.math.RoundingMode.HALF_UP);
                }
                itemsTotal = itemsTotal.add(sub.subtract(dAmt).max(BigDecimal.ZERO));
            }
            if (itemsTotal.compareTo(BigDecimal.ZERO) > 0) {
                dealAmount = itemsTotal;
            }
        }
        deal.setAmount(dealAmount != null ? dealAmount : deal.getAmount());

        if (request.getStage() != null) {
            deal.setStage(request.getStage());
            int defaultProb = stageConfigRepository.findByStage(request.getStage())
                    .map(PipelineStageConfig::getProbability)
                    .orElse(request.getStage().getDefaultProbability());
            deal.setProbability(request.getProbability() != null ? request.getProbability() : defaultProb);
            if (request.getStage() == DealStage.CLOSED_WON || request.getStage() == DealStage.CLOSED_LOST) {
                deal.setActualCloseDate(LocalDate.now());
            }
        } else if (request.getProbability() != null) {
            deal.setProbability(request.getProbability());
        }

        deal.setExpectedCloseDate(request.getExpectedCloseDate());
        if (request.getDealType() != null) deal.setDealType(request.getDealType());
        if (request.getPriority() != null) deal.setPriority(request.getPriority());
        deal.setCustomerId(request.getCustomerId());
        deal.setCustomerName(request.getCustomerName());
        deal.setLeadId(request.getLeadId());
        deal.setAssignedToUserId(request.getAssignedToUserId());
        deal.setAssignedToUserName(request.getAssignedToUserName());
        deal.setDescription(request.getDescription());
        deal.setLossReason(request.getLossReason());

        if (request.getItems() != null) {
            syncDealItems(deal.getId(), request.getItems());
        }

        Deal saved = dealRepository.save(deal);

        if (saved.getStage() == DealStage.CLOSED_WON && previousStage != DealStage.CLOSED_WON) {
            Long customerId = dealClosedWonSyncService.syncDealClosedWon(saved);
            if (customerId != null && !customerId.equals(saved.getCustomerId())) {
                saved.setCustomerId(customerId);
                saved = dealRepository.save(saved);
            }
        }

        log.info("Updated deal '{}' (id: {})", saved.getDealName(), saved.getId());
        return DealResponse.fromEntity(saved, getDealItems(saved.getId()));
    }

    @Transactional
    public DealResponse updateDealStage(Long id, DealStage newStage, Integer customProbability) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found with id: " + id));

        DealStage previousStage = deal.getStage();

        deal.setStage(newStage);
        int defaultProb = stageConfigRepository.findByStage(newStage)
                .map(PipelineStageConfig::getProbability)
                .orElse(newStage.getDefaultProbability());
        deal.setProbability(customProbability != null ? customProbability : defaultProb);

        if (newStage == DealStage.CLOSED_WON || newStage == DealStage.CLOSED_LOST) {
            deal.setActualCloseDate(LocalDate.now());
        } else {
            deal.setActualCloseDate(null);
            deal.setLossReason(null);
        }

        Deal saved = dealRepository.save(deal);

        if (newStage == DealStage.CLOSED_WON && previousStage != DealStage.CLOSED_WON) {
            Long customerId = dealClosedWonSyncService.syncDealClosedWon(saved);
            if (customerId != null && !customerId.equals(saved.getCustomerId())) {
                saved.setCustomerId(customerId);
                saved = dealRepository.save(saved);
            }
        }

        log.info("Moved deal id {} to stage {}", id, newStage);
        return DealResponse.fromEntity(saved);
    }

    @Transactional
    public DealResponse closeDealWon(Long id) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found with id: " + id));

        DealStage previousStage = deal.getStage();

        deal.setStage(DealStage.CLOSED_WON);
        deal.setProbability(100);
        deal.setActualCloseDate(LocalDate.now());
        deal.setLossReason(null);

        Deal saved = dealRepository.save(deal);

        if (previousStage != DealStage.CLOSED_WON) {
            Long customerId = dealClosedWonSyncService.syncDealClosedWon(saved);
            if (customerId != null && !customerId.equals(saved.getCustomerId())) {
                saved.setCustomerId(customerId);
                saved = dealRepository.save(saved);
            }
        }

        log.info("Deal id {} CLOSED WON for ₹{}!", id, saved.getAmount());
        return DealResponse.fromEntity(saved);
    }

    @Transactional
    public DealResponse closeDealLost(Long id, String lossReason) {
        Deal deal = dealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Deal not found with id: " + id));

        deal.setStage(DealStage.CLOSED_LOST);
        deal.setProbability(0);
        deal.setActualCloseDate(LocalDate.now());
        deal.setLossReason(lossReason != null ? lossReason : "Not specified");

        Deal saved = dealRepository.save(deal);
        log.info("Deal id {} CLOSED LOST with reason: {}", id, deal.getLossReason());
        return DealResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteDeal(Long id) {
        if (!dealRepository.existsById(id)) {
            throw new ResourceNotFoundException("Deal not found with id: " + id);
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            throw new AccessDeniedException("Access Denied: Only Administrators have permission to delete sales pipeline deals.");
        }
        dealRepository.deleteById(id);
        log.info("Deleted deal id {}", id);
    }

    @Transactional(readOnly = true)
    public List<PipelineSummaryResponse> getPipelineSummary() {
        List<PipelineSummaryResponse> summaries = new ArrayList<>();
        List<PipelineStageConfig> configs = stageConfigRepository.findAllByOrderByStageOrderAsc();

        if (configs.isEmpty()) {
            for (DealStage stage : DealStage.values()) {
                List<Deal> deals = dealRepository.findByStage(stage);
                BigDecimal totalValue = deals.stream()
                        .map(Deal::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal weightedValue = deals.stream()
                        .map(d -> d.getExpectedRevenue() != null ? d.getExpectedRevenue() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                summaries.add(PipelineSummaryResponse.builder()
                        .stage(stage)
                        .stageDisplayName(stage.getDisplayName())
                        .defaultProbability(stage.getDefaultProbability())
                        .count(deals.size())
                        .totalValue(totalValue)
                        .weightedValue(weightedValue)
                        .deals(deals.stream().map(DealResponse::fromEntity).collect(Collectors.toList()))
                        .build());
            }
        } else {
            for (PipelineStageConfig config : configs) {
                List<Deal> deals = dealRepository.findByStage(config.getStage());
                BigDecimal totalValue = deals.stream()
                        .map(Deal::getAmount)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal weightedValue = deals.stream()
                        .map(d -> d.getExpectedRevenue() != null ? d.getExpectedRevenue() : BigDecimal.ZERO)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                summaries.add(PipelineSummaryResponse.builder()
                        .stage(config.getStage())
                        .stageDisplayName(config.getDisplayName())
                        .defaultProbability(config.getProbability())
                        .count(deals.size())
                        .totalValue(totalValue)
                        .weightedValue(weightedValue)
                        .deals(deals.stream().map(DealResponse::fromEntity).collect(Collectors.toList()))
                        .build());
            }
        }

        return summaries;
    }

    @Transactional(readOnly = true)
    public DealStatsResponse getDealStats() {
        long totalDeals = dealRepository.count();
        long wonDeals = dealRepository.countByStage(DealStage.CLOSED_WON);
        long lostDeals = dealRepository.countByStage(DealStage.CLOSED_LOST);
        long activeDeals = totalDeals - wonDeals - lostDeals;

        BigDecimal totalPipelineValue = dealRepository.sumTotalPipelineValue();
        BigDecimal weightedForecastValue = dealRepository.sumWeightedPipelineRevenue();
        BigDecimal closedWonRevenue = dealRepository.sumClosedWonRevenue();

        double winRate = 0.0;
        long closedTotal = wonDeals + lostDeals;
        if (closedTotal > 0) {
            winRate = Math.round(((double) wonDeals / closedTotal) * 1000.0) / 10.0;
        }

        BigDecimal averageDealSize = BigDecimal.ZERO;
        if (totalDeals > 0) {
            List<Deal> allDeals = dealRepository.findAll();
            BigDecimal sumAll = allDeals.stream()
                    .map(Deal::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            averageDealSize = sumAll.divide(BigDecimal.valueOf(totalDeals), 2, RoundingMode.HALF_UP);
        }

        Map<String, Long> dealsByStage = new LinkedHashMap<>();
        Map<String, BigDecimal> valueByStage = new LinkedHashMap<>();
        for (DealStage stage : DealStage.values()) {
            dealsByStage.put(stage.name(), dealRepository.countByStage(stage));
            valueByStage.put(stage.name(), dealRepository.sumValueByStage(stage));
        }

        Map<String, Long> dealsByType = new LinkedHashMap<>();
        for (DealType type : DealType.values()) {
            dealsByType.put(type.name(), 0L);
        }
        List<Deal> all = dealRepository.findAll();
        for (Deal d : all) {
            if (d.getDealType() != null) {
                dealsByType.put(d.getDealType().name(), dealsByType.getOrDefault(d.getDealType().name(), 0L) + 1L);
            }
        }

        return DealStatsResponse.builder()
                .totalDeals(totalDeals)
                .activeDeals(activeDeals)
                .wonDeals(wonDeals)
                .lostDeals(lostDeals)
                .totalPipelineValue(totalPipelineValue)
                .weightedForecastValue(weightedForecastValue)
                .closedWonRevenue(closedWonRevenue)
                .winRate(winRate)
                .averageDealSize(averageDealSize)
                .dealsByStage(dealsByStage)
                .valueByStage(valueByStage)
                .dealsByType(dealsByType)
                .build();
    }

    // Pipeline Stages Configuration
    @Transactional(readOnly = true)
    public List<PipelineStageConfigDTO> getAllStageConfigs() {
        return stageConfigRepository.findAllByOrderByStageOrderAsc()
                .stream()
                .map(PipelineStageConfigDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public List<PipelineStageConfigDTO> updateStageConfigs(List<UpdatePipelineStageConfigRequest> requests) {
        List<PipelineStageConfigDTO> results = new ArrayList<>();
        for (UpdatePipelineStageConfigRequest req : requests) {
            PipelineStageConfig config = stageConfigRepository.findByStage(req.getStage())
                    .orElseGet(() -> PipelineStageConfig.builder().stage(req.getStage()).build());

            config.setDisplayName(req.getDisplayName());
            config.setProbability(req.getProbability());
            if (req.getStageOrder() != null) config.setStageOrder(req.getStageOrder());
            if (req.getColor() != null) config.setColor(req.getColor());
            if (req.getDescription() != null) config.setDescription(req.getDescription());
            if (req.getIsActive() != null) config.setIsActive(req.getIsActive());

            PipelineStageConfig saved = stageConfigRepository.save(config);
            results.add(PipelineStageConfigDTO.fromEntity(saved));
        }
        log.info("Admin updated {} pipeline stage configurations", requests.size());
        return results;
    }

    @Transactional
    public PipelineStageConfigDTO updateStageConfig(DealStage stage, UpdatePipelineStageConfigRequest req) {
        PipelineStageConfig config = stageConfigRepository.findByStage(stage)
                .orElseGet(() -> PipelineStageConfig.builder().stage(stage).build());

        config.setDisplayName(req.getDisplayName());
        config.setProbability(req.getProbability());
        if (req.getStageOrder() != null) config.setStageOrder(req.getStageOrder());
        if (req.getColor() != null) config.setColor(req.getColor());
        if (req.getDescription() != null) config.setDescription(req.getDescription());
        if (req.getIsActive() != null) config.setIsActive(req.getIsActive());

        PipelineStageConfig saved = stageConfigRepository.save(config);
        log.info("Admin updated pipeline stage configuration for {}", stage);
        return PipelineStageConfigDTO.fromEntity(saved);
    }
}

