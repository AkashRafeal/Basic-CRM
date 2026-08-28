package com.crm.analytics.service;

import com.crm.analytics.dto.*;
import com.crm.analytics.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final JdbcTemplate jdbcTemplate;

    public static class UserScope {
        public final boolean isAdmin;
        public final boolean isManager;
        public final boolean isEmployee;
        public final Long currentUserId;
        public final List<Long> accessibleUserIds;

        public UserScope(boolean isAdmin, boolean isManager, boolean isEmployee, Long currentUserId, List<Long> accessibleUserIds) {
            this.isAdmin = isAdmin;
            this.isManager = isManager;
            this.isEmployee = isEmployee;
            this.currentUserId = currentUserId;
            this.accessibleUserIds = accessibleUserIds != null ? accessibleUserIds : Collections.emptyList();
        }

        public String getSqlInClause() {
            if (isAdmin || accessibleUserIds.isEmpty()) return "";
            return accessibleUserIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        }
    }

    public UserScope resolveScope(UserPrincipal user) {
        if (user == null) {
            return new UserScope(true, false, false, null, Collections.emptyList());
        }

        String role = user.getRole() != null ? user.getRole().replace("ROLE_", "").toUpperCase() : "EMPLOYEE";
        Long userId = user.getId();

        if ("ADMIN".equals(role)) {
            return new UserScope(true, false, false, userId, Collections.emptyList());
        } else if ("MANAGER".equals(role)) {
            List<Long> teamIds = new ArrayList<>();
            if (userId != null) {
                teamIds.add(userId);
                List<Long> memberIds = jdbcTemplate.query(
                        "SELECT id FROM crm_users WHERE manager_id = ? OR (department_id = (SELECT department_id FROM crm_users WHERE id = ?) AND department_id IS NOT NULL)",
                        (rs, rowNum) -> rs.getLong("id"),
                        userId, userId
                );
                teamIds.addAll(memberIds);
            }
            List<Long> distinctTeamIds = teamIds.stream().distinct().collect(Collectors.toList());
            return new UserScope(false, true, false, userId, distinctTeamIds);
        } else {
            List<Long> singleId = userId != null ? List.of(userId) : Collections.emptyList();
            return new UserScope(false, false, true, userId, singleId);
        }
    }

    @Transactional(readOnly = true)
    public ExecutiveSummaryReport getExecutiveSummaryReport(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        String inClause = scope.getSqlInClause();

        // 1. Deals aggregation
        String dealsWhere = scope.isAdmin ? " WHERE stage != 'CLOSED_LOST'" :
                " WHERE stage != 'CLOSED_LOST' AND assigned_to_user_id IN (" + inClause + ")";
        String allDealsWhere = scope.isAdmin ? "" : " WHERE assigned_to_user_id IN (" + inClause + ")";
        String wonDealsWhere = scope.isAdmin ? " WHERE stage = 'CLOSED_WON'" :
                " WHERE stage = 'CLOSED_WON' AND assigned_to_user_id IN (" + inClause + ")";
        String lostDealsWhere = scope.isAdmin ? " WHERE stage = 'CLOSED_LOST'" :
                " WHERE stage = 'CLOSED_LOST' AND assigned_to_user_id IN (" + inClause + ")";

        BigDecimal totalPipeline = queryForBigDecimal("SELECT COALESCE(SUM(amount), 0) FROM crm_deals" + dealsWhere);
        BigDecimal weightedForecast = queryForBigDecimal("SELECT COALESCE(SUM(expected_revenue), 0) FROM crm_deals" + dealsWhere);
        long totalDeals = queryForLong("SELECT COUNT(*) FROM crm_deals" + allDealsWhere);
        long wonDeals = queryForLong("SELECT COUNT(*) FROM crm_deals" + wonDealsWhere);
        long lostDeals = queryForLong("SELECT COUNT(*) FROM crm_deals" + lostDealsWhere);
        long activeDeals = Math.max(0, totalDeals - wonDeals - lostDeals);

        double winRate = 0.0;
        if (wonDeals + lostDeals > 0) {
            winRate = Math.round(((double) wonDeals / (wonDeals + lostDeals)) * 1000.0) / 10.0;
        }

        // 2. Customers aggregation
        String custWhere = scope.isAdmin ? " WHERE is_deleted = false" :
                " WHERE is_deleted = false AND (assigned_account_manager_id IN (" + inClause + ") OR id IN (SELECT DISTINCT customer_id FROM crm_deals WHERE assigned_to_user_id IN (" + inClause + ") AND customer_id IS NOT NULL))";
        String activeCustWhere = custWhere + " AND customer_status = 'ACTIVE'";

        BigDecimal recognizedCustomerArr = queryForBigDecimal("SELECT COALESCE(SUM(annual_revenue), 0) FROM crm_customers" + custWhere);
        long totalCustomers = queryForLong("SELECT COUNT(*) FROM crm_customers" + custWhere);
        long activeCustomers = queryForLong("SELECT COUNT(*) FROM crm_customers" + activeCustWhere);

        // 3. Leads aggregation
        String leadWhere = scope.isAdmin ? " WHERE is_archived = false" :
                " WHERE is_archived = false AND assigned_to_user_id IN (" + inClause + ")";
        String convLeadWhere = leadWhere + " AND lead_status = 'CONVERTED'";

        BigDecimal totalProspectLeadValue = queryForBigDecimal("SELECT COALESCE(SUM(estimated_value), 0) FROM crm_leads" + leadWhere);
        long totalLeads = queryForLong("SELECT COUNT(*) FROM crm_leads" + leadWhere);
        long convertedLeads = queryForLong("SELECT COUNT(*) FROM crm_leads" + convLeadWhere);
        double leadConversionRate = totalLeads > 0 ? (Math.round(((double) convertedLeads / totalLeads) * 1000.0) / 10.0) : 0.0;

        // 4. Tasks aggregation
        String taskWhere = scope.isAdmin ? " WHERE is_deleted = false" :
                " WHERE is_deleted = false AND assigned_to_user_id IN (" + inClause + ")";
        String doneTaskWhere = taskWhere + " AND status = 'DONE'";
        String overdueTaskWhere = taskWhere + " AND status != 'DONE' AND due_date < CURRENT_DATE";

        long totalTasks = queryForLong("SELECT COUNT(*) FROM crm_tasks" + taskWhere);
        long completedTasks = queryForLong("SELECT COUNT(*) FROM crm_tasks" + doneTaskWhere);
        long overdueTasks = queryForLong("SELECT COUNT(*) FROM crm_tasks" + overdueTaskWhere);
        double taskCompletionRate = totalTasks > 0 ? (Math.round(((double) completedTasks / totalTasks) * 1000.0) / 10.0) : 0.0;

        // 5. Follow-ups aggregation
        String fuTodayWhere = scope.isAdmin ? " WHERE DATE(scheduled_at) = CURRENT_DATE" :
                " WHERE DATE(scheduled_at) = CURRENT_DATE AND assigned_to_user_id IN (" + inClause + ")";
        String fuCompWhere = scope.isAdmin ? " WHERE status = 'COMPLETED'" :
                " WHERE status = 'COMPLETED' AND assigned_to_user_id IN (" + inClause + ")";
        String fuPosWhere = scope.isAdmin ? " WHERE status = 'COMPLETED' AND outcome IN ('INTERESTED', 'PROPOSAL_REQUESTED', 'MEETING_BOOKED', 'DEAL_WON')" :
                " WHERE status = 'COMPLETED' AND outcome IN ('INTERESTED', 'PROPOSAL_REQUESTED', 'MEETING_BOOKED', 'DEAL_WON') AND assigned_to_user_id IN (" + inClause + ")";

        long followUpsToday = queryForLong("SELECT COUNT(*) FROM crm_followups" + fuTodayWhere);
        long totalCompletedFollowups = queryForLong("SELECT COUNT(*) FROM crm_followups" + fuCompWhere);
        long positiveFollowups = queryForLong("SELECT COUNT(*) FROM crm_followups" + fuPosWhere);
        double followUpSuccessRate = totalCompletedFollowups > 0 ? (Math.round(((double) positiveFollowups / totalCompletedFollowups) * 1000.0) / 10.0) : 0.0;

        // 6. Top Performers
        List<SalesLeaderboardItem> leaderboard = getTeamLeaderboardReport(principal).getLeaderboard();
        List<SalesLeaderboardItem> topPerformers = leaderboard.size() > 3 ? leaderboard.subList(0, 3) : leaderboard;

        return ExecutiveSummaryReport.builder()
                .generatedAt(LocalDateTime.now())
                .totalPipelineValue(totalPipeline)
                .weightedForecastValue(weightedForecast)
                .recognizedCustomerArr(recognizedCustomerArr)
                .totalProspectLeadValue(totalProspectLeadValue)
                .totalDeals(totalDeals)
                .activeDeals(activeDeals)
                .wonDeals(wonDeals)
                .winRate(winRate)
                .totalCustomers(totalCustomers)
                .activeCustomers(activeCustomers)
                .totalLeads(totalLeads)
                .leadConversionRate(leadConversionRate)
                .totalTasks(totalTasks)
                .overdueTasks(overdueTasks)
                .taskCompletionRate(taskCompletionRate)
                .followUpsToday(followUpsToday)
                .followUpSuccessRate(followUpSuccessRate)
                .topPerformers(topPerformers)
                .build();
    }

    @Transactional(readOnly = true)
    public SalesPerformanceReport getSalesPerformanceReport(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        String inClause = scope.getSqlInClause();

        String nonLostWhere = scope.isAdmin ? " WHERE stage != 'CLOSED_LOST'" :
                " WHERE stage != 'CLOSED_LOST' AND assigned_to_user_id IN (" + inClause + ")";
        String wonWhere = scope.isAdmin ? " WHERE stage = 'CLOSED_WON'" :
                " WHERE stage = 'CLOSED_WON' AND assigned_to_user_id IN (" + inClause + ")";
        String lostWhere = scope.isAdmin ? " WHERE stage = 'CLOSED_LOST'" :
                " WHERE stage = 'CLOSED_LOST' AND assigned_to_user_id IN (" + inClause + ")";
        String allWhere = scope.isAdmin ? "" : " WHERE assigned_to_user_id IN (" + inClause + ")";

        BigDecimal totalPipeline = queryForBigDecimal("SELECT COALESCE(SUM(amount), 0) FROM crm_deals" + nonLostWhere);
        BigDecimal weightedForecast = queryForBigDecimal("SELECT COALESCE(SUM(expected_revenue), 0) FROM crm_deals" + nonLostWhere);
        BigDecimal closedWonRevenue = queryForBigDecimal("SELECT COALESCE(SUM(amount), 0) FROM crm_deals" + wonWhere);
        BigDecimal closedLostValue = queryForBigDecimal("SELECT COALESCE(SUM(amount), 0) FROM crm_deals" + lostWhere);

        long totalDeals = queryForLong("SELECT COUNT(*) FROM crm_deals" + allWhere);
        long wonDeals = queryForLong("SELECT COUNT(*) FROM crm_deals" + wonWhere);
        long lostDeals = queryForLong("SELECT COUNT(*) FROM crm_deals" + lostWhere);
        long activeDeals = Math.max(0, totalDeals - wonDeals - lostDeals);

        double winRate = 0.0;
        if (wonDeals + lostDeals > 0) {
            winRate = Math.round(((double) wonDeals / (wonDeals + lostDeals)) * 1000.0) / 10.0;
        }

        BigDecimal averageDealSize = BigDecimal.ZERO;
        if (totalDeals > 0) {
            BigDecimal allDealsAmount = queryForBigDecimal("SELECT COALESCE(SUM(amount), 0) FROM crm_deals" + allWhere);
            averageDealSize = allDealsAmount.divide(BigDecimal.valueOf(totalDeals), 2, RoundingMode.HALF_UP);
        }

        // Deals & Revenue by Stage
        Map<String, Long> dealsByStage = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueByStage = new LinkedHashMap<>();
        String stageSql = "SELECT stage, COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM crm_deals" + allWhere + " GROUP BY stage";
        List<Map<String, Object>> stageRows = jdbcTemplate.queryForList(stageSql);
        for (Map<String, Object> r : stageRows) {
            String stage = (String) r.get("stage");
            long cnt = ((Number) r.get("cnt")).longValue();
            BigDecimal total = (BigDecimal) r.get("total");
            dealsByStage.put(stage, cnt);
            revenueByStage.put(stage, total);
        }

        // Deals & Revenue by Type
        Map<String, Long> dealsByType = new LinkedHashMap<>();
        Map<String, BigDecimal> revenueByType = new LinkedHashMap<>();
        String typeSql = "SELECT deal_type, COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM crm_deals" + allWhere + " GROUP BY deal_type";
        List<Map<String, Object>> typeRows = jdbcTemplate.queryForList(typeSql);
        for (Map<String, Object> r : typeRows) {
            String dealType = (String) r.get("deal_type");
            long cnt = ((Number) r.get("cnt")).longValue();
            BigDecimal total = (BigDecimal) r.get("total");
            dealsByType.put(dealType, cnt);
            revenueByType.put(dealType, total);
        }

        // Loss Reasons Pareto
        Map<String, Long> lossReasonsPareto = new LinkedHashMap<>();
        String lossSql = "SELECT COALESCE(loss_reason, 'Unspecified') as reason, COUNT(*) as cnt FROM crm_deals WHERE stage = 'CLOSED_LOST'" +
                (scope.isAdmin ? "" : " AND assigned_to_user_id IN (" + inClause + ")") +
                " GROUP BY loss_reason ORDER BY cnt DESC";
        List<Map<String, Object>> lossRows = jdbcTemplate.queryForList(lossSql);
        for (Map<String, Object> r : lossRows) {
            String reason = (String) r.get("reason");
            long cnt = ((Number) r.get("cnt")).longValue();
            lossReasonsPareto.put(reason, cnt);
        }

        return SalesPerformanceReport.builder()
                .totalPipelineValue(totalPipeline)
                .weightedForecastValue(weightedForecast)
                .closedWonRevenue(closedWonRevenue)
                .closedLostValue(closedLostValue)
                .averageDealSize(averageDealSize)
                .winRate(winRate)
                .totalDeals(totalDeals)
                .wonDeals(wonDeals)
                .lostDeals(lostDeals)
                .activeDeals(activeDeals)
                .dealsByStage(dealsByStage)
                .revenueByStage(revenueByStage)
                .dealsByType(dealsByType)
                .revenueByType(revenueByType)
                .lossReasonsPareto(lossReasonsPareto)
                .build();
    }

    @Transactional(readOnly = true)
    public TeamLeaderboardReport getTeamLeaderboardReport(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);

        String userFilter = "";
        if (scope.isManager) {
            userFilter = " WHERE id IN (" + scope.getSqlInClause() + ")";
        } else if (scope.isEmployee) {
            userFilter = " WHERE id = " + scope.currentUserId;
        }

        List<Map<String, Object>> userRows = jdbcTemplate.queryForList(
                "SELECT id, name, email, role FROM crm_users" + (userFilter.isEmpty() ? " WHERE active = true" : userFilter + " AND active = true") + " ORDER BY id ASC"
        );

        List<SalesLeaderboardItem> items = new ArrayList<>();
        BigDecimal teamTotalRevenue = BigDecimal.ZERO;
        BigDecimal teamActivePipeline = BigDecimal.ZERO;
        long teamDealsWon = 0;
        long teamTouchpoints = 0;

        for (Map<String, Object> u : userRows) {
            Long userId = ((Number) u.get("id")).longValue();
            String name = (String) u.get("name");
            String email = (String) u.get("email");
            String role = (String) u.get("role");

            BigDecimal wonRev = queryForBigDecimal("SELECT COALESCE(SUM(amount), 0) FROM crm_deals WHERE assigned_to_user_id = ? AND stage = 'CLOSED_WON'", userId);
            BigDecimal activePipe = queryForBigDecimal("SELECT COALESCE(SUM(amount), 0) FROM crm_deals WHERE assigned_to_user_id = ? AND stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')", userId);
            long wonCount = queryForLong("SELECT COUNT(*) FROM crm_deals WHERE assigned_to_user_id = ? AND stage = 'CLOSED_WON'", userId);
            long activeCount = queryForLong("SELECT COUNT(*) FROM crm_deals WHERE assigned_to_user_id = ? AND stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')", userId);
            long touchpoints = queryForLong("SELECT COUNT(*) FROM crm_followups WHERE assigned_to_user_id = ? AND status = 'COMPLETED'", userId);
            long totalTasks = queryForLong("SELECT COUNT(*) FROM crm_tasks WHERE assigned_to_user_id = ? AND is_deleted = false", userId);
            long doneTasks = queryForLong("SELECT COUNT(*) FROM crm_tasks WHERE assigned_to_user_id = ? AND status = 'DONE' AND is_deleted = false", userId);
            double taskRate = totalTasks > 0 ? (Math.round(((double) doneTasks / totalTasks) * 1000.0) / 10.0) : 0.0;

            teamTotalRevenue = teamTotalRevenue.add(wonRev);
            teamActivePipeline = teamActivePipeline.add(activePipe);
            teamDealsWon += wonCount;
            teamTouchpoints += touchpoints;

            items.add(SalesLeaderboardItem.builder()
                    .userId(userId)
                    .userName(name)
                    .userEmail(email)
                    .role(role)
                    .closedWonRevenue(wonRev)
                    .activePipelineValue(activePipe)
                    .dealsWon(wonCount)
                    .activeDeals(activeCount)
                    .touchpointsCompleted(touchpoints)
                    .tasksCompleted(doneTasks)
                    .taskCompletionRate(taskRate)
                    .build());
        }

        // Sort by closedWonRevenue DESC, then activePipelineValue DESC
        items.sort((a, b) -> {
            int comp = b.getClosedWonRevenue().compareTo(a.getClosedWonRevenue());
            if (comp != 0) return comp;
            return b.getActivePipelineValue().compareTo(a.getActivePipelineValue());
        });

        for (int i = 0; i < items.size(); i++) {
            items.get(i).setRank(i + 1);
        }

        return TeamLeaderboardReport.builder()
                .totalReps(items.size())
                .teamTotalRevenue(teamTotalRevenue)
                .teamActivePipeline(teamActivePipeline)
                .teamDealsWon(teamDealsWon)
                .teamTouchpointsCompleted(teamTouchpoints)
                .leaderboard(items)
                .build();
    }

    @Transactional(readOnly = true)
    public LeadSourceReport getLeadSourceReport(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        String inClause = scope.getSqlInClause();

        String leadWhere = scope.isAdmin ? " WHERE is_archived = false" :
                " WHERE is_archived = false AND assigned_to_user_id IN (" + inClause + ")";
        String convWhere = leadWhere + " AND lead_status = 'CONVERTED'";

        long totalLeads = queryForLong("SELECT COUNT(*) FROM crm_leads" + leadWhere);
        long convertedLeads = queryForLong("SELECT COUNT(*) FROM crm_leads" + convWhere);
        double overallRate = totalLeads > 0 ? (Math.round(((double) convertedLeads / totalLeads) * 1000.0) / 10.0) : 0.0;
        BigDecimal totalEstValue = queryForBigDecimal("SELECT COALESCE(SUM(estimated_value), 0) FROM crm_leads" + leadWhere);

        String sql = "SELECT lead_source, COUNT(*) as cnt, " +
                "SUM(CASE WHEN lead_status = 'CONVERTED' THEN 1 ELSE 0 END) as conv_cnt, " +
                "COALESCE(SUM(estimated_value), 0) as val " +
                "FROM crm_leads" + leadWhere + " GROUP BY lead_source";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        List<LeadSourceReport.LeadSourceMetric> metrics = new ArrayList<>();
        for (Map<String, Object> r : rows) {
            String source = (String) r.get("lead_source");
            long cnt = ((Number) r.get("cnt")).longValue();
            long convCnt = ((Number) r.get("conv_cnt")).longValue();
            BigDecimal val = (BigDecimal) r.get("val");
            double rate = cnt > 0 ? (Math.round(((double) convCnt / cnt) * 1000.0) / 10.0) : 0.0;

            metrics.add(LeadSourceReport.LeadSourceMetric.builder()
                    .source(source)
                    .sourceDisplayName(formatDisplayName(source))
                    .leadCount(cnt)
                    .convertedCount(convCnt)
                    .conversionRate(rate)
                    .totalValue(val)
                    .build());
        }

        return LeadSourceReport.builder()
                .totalLeads(totalLeads)
                .convertedLeads(convertedLeads)
                .overallConversionRate(overallRate)
                .totalEstimatedValue(totalEstValue)
                .sourceMetrics(metrics)
                .build();
    }

    @Transactional(readOnly = true)
    public CustomerIndustryReport getCustomerIndustryReport(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        if (scope.isEmployee) {
            throw new AccessDeniedException("Customer portfolio analysis is restricted for Sales Representative accounts.");
        }

        String inClause = scope.getSqlInClause();
        String custWhere = scope.isAdmin ? " WHERE is_deleted = false" :
                " WHERE is_deleted = false AND (assigned_account_manager_id IN (" + inClause + ") OR id IN (SELECT DISTINCT customer_id FROM crm_deals WHERE assigned_to_user_id IN (" + inClause + ") AND customer_id IS NOT NULL))";

        long totalCustomers = queryForLong("SELECT COUNT(*) FROM crm_customers" + custWhere);
        BigDecimal totalArr = queryForBigDecimal("SELECT COALESCE(SUM(annual_revenue), 0) FROM crm_customers" + custWhere);
        BigDecimal avgArr = totalCustomers > 0 ? totalArr.divide(BigDecimal.valueOf(totalCustomers), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        List<Map<String, Object>> indRows = jdbcTemplate.queryForList(
                "SELECT industry, COUNT(*) as cnt, COALESCE(SUM(annual_revenue), 0) as arr FROM crm_customers" + custWhere + " GROUP BY industry"
        );

        List<CustomerIndustryReport.IndustryMetric> industryMetrics = new ArrayList<>();
        for (Map<String, Object> r : indRows) {
            String ind = (String) r.get("industry");
            long cnt = ((Number) r.get("cnt")).longValue();
            BigDecimal arr = (BigDecimal) r.get("arr");
            double share = totalArr.compareTo(BigDecimal.ZERO) > 0 ?
                    arr.divide(totalArr, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue() : 0.0;

            industryMetrics.add(CustomerIndustryReport.IndustryMetric.builder()
                    .industry(ind)
                    .industryDisplayName(formatDisplayName(ind))
                    .customerCount(cnt)
                    .totalArr(arr)
                    .revenueSharePercent(Math.round(share * 10.0) / 10.0)
                    .build());
        }

        Map<String, Long> tierBreakdown = new LinkedHashMap<>();
        Map<String, BigDecimal> tierRevenue = new LinkedHashMap<>();
        List<Map<String, Object>> tierRows = jdbcTemplate.queryForList(
                "SELECT customer_tier, COUNT(*) as cnt, COALESCE(SUM(annual_revenue), 0) as arr FROM crm_customers" + custWhere + " GROUP BY customer_tier"
        );
        for (Map<String, Object> r : tierRows) {
            String tier = (String) r.get("customer_tier");
            long cnt = ((Number) r.get("cnt")).longValue();
            BigDecimal arr = (BigDecimal) r.get("arr");
            tierBreakdown.put(tier, cnt);
            tierRevenue.put(tier, arr);
        }

        return CustomerIndustryReport.builder()
                .totalCustomers(totalCustomers)
                .totalAnnualRevenue(totalArr)
                .averageCustomerArr(avgArr)
                .overallRetentionRate(94.5)
                .industryMetrics(industryMetrics)
                .tierBreakdown(tierBreakdown)
                .tierRevenue(tierRevenue)
                .build();
    }

    @Transactional(readOnly = true)
    public ProductPerformanceReport getProductPerformanceReport(UserPrincipal principal) {
        List<Map<String, Object>> productRows = jdbcTemplate.queryForList("""
            SELECT 
                p.id, p.name, p.sku, p.category, p.unit_price, p.status, p.is_physical,
                (SELECT COUNT(*) FROM crm_lead_products lp WHERE lp.product_id = p.id) AS lead_count,
                (SELECT COUNT(*) FROM crm_deal_products dp WHERE dp.product_id = p.id) AS deal_count,
                (SELECT COUNT(*) FROM crm_deal_products dp JOIN crm_deals d ON dp.deal_id = d.id WHERE dp.product_id = p.id AND d.stage = 'CLOSED_WON') AS won_count,
                (SELECT COALESCE(SUM(dp.total_price), 0) FROM crm_deal_products dp JOIN crm_deals d ON dp.deal_id = d.id WHERE dp.product_id = p.id AND d.stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')) AS pipeline_val,
                (SELECT COALESCE(SUM(dp.total_price), 0) FROM crm_deal_products dp JOIN crm_deals d ON dp.deal_id = d.id WHERE dp.product_id = p.id AND d.stage = 'CLOSED_WON') AS won_rev,
                (SELECT COUNT(DISTINCT cp.customer_id) FROM crm_customer_products cp WHERE cp.product_id = p.id) AS cust_count
            FROM crm_products p
            ORDER BY won_rev DESC, lead_count DESC, p.name ASC
        """);

        List<ProductPerformanceReport.ProductMetricItem> items = new ArrayList<>();
        BigDecimal totalRev = BigDecimal.ZERO;
        BigDecimal totalPipe = BigDecimal.ZERO;
        long activeCount = 0;

        for (Map<String, Object> r : productRows) {
            Long id = ((Number) r.get("id")).longValue();
            String name = (String) r.get("name");
            String sku = (String) r.get("sku");
            String cat = (String) r.get("category");
            BigDecimal unitPrice = (BigDecimal) r.get("unit_price");
            String status = (String) r.get("status");
            Boolean isPhysical = (Boolean) r.get("is_physical");
            long leadCount = ((Number) r.get("lead_count")).longValue();
            long dealCount = ((Number) r.get("deal_count")).longValue();
            long wonCount = ((Number) r.get("won_count")).longValue();
            BigDecimal pipelineVal = (BigDecimal) r.get("pipeline_val");
            BigDecimal wonRev = (BigDecimal) r.get("won_rev");
            long custCount = ((Number) r.get("cust_count")).longValue();

            if ("ACTIVE".equalsIgnoreCase(status)) {
                activeCount++;
            }
            totalRev = totalRev.add(wonRev);
            totalPipe = totalPipe.add(pipelineVal);

            double winRate = 0.0;
            if (dealCount > 0) {
                winRate = Math.round(((double) wonCount / dealCount) * 1000.0) / 10.0;
            }

            items.add(ProductPerformanceReport.ProductMetricItem.builder()
                    .productId(id)
                    .productName(name)
                    .sku(sku)
                    .category(cat)
                    .unitPrice(unitPrice)
                    .status(status)
                    .isPhysical(isPhysical)
                    .interestedLeadsCount(leadCount)
                    .totalDealsCount(dealCount)
                    .wonDealsCount(wonCount)
                    .pipelineValue(pipelineVal)
                    .closedWonRevenue(wonRev)
                    .activeCustomersCount(custCount)
                    .conversionRate(winRate)
                    .build());
        }

        List<ProductPerformanceReport.ProductMetricItem> topRev = items.stream()
                .sorted((a, b) -> b.getClosedWonRevenue().compareTo(a.getClosedWonRevenue()))
                .limit(5)
                .collect(Collectors.toList());

        List<ProductPerformanceReport.ProductMetricItem> topInterest = items.stream()
                .sorted((a, b) -> Long.compare(b.getInterestedLeadsCount(), a.getInterestedLeadsCount()))
                .limit(5)
                .collect(Collectors.toList());

        return ProductPerformanceReport.builder()
                .totalProducts(productRows.size())
                .activeProducts(activeCount)
                .totalProductRevenue(totalRev)
                .totalProductPipelineValue(totalPipe)
                .products(items)
                .topRevenueProducts(topRev)
                .topInterestedProducts(topInterest)
                .build();
    }

    private BigDecimal queryForBigDecimal(String sql, Object... args) {
        BigDecimal val = jdbcTemplate.queryForObject(sql, BigDecimal.class, args);
        return val != null ? val : BigDecimal.ZERO;
    }

    private long queryForLong(String sql, Object... args) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class, args);
        return val != null ? val : 0L;
    }

    private String formatDisplayName(String enumVal) {
        if (enumVal == null) return "";
        return Arrays.stream(enumVal.split("_"))
                .map(word -> word.substring(0, 1).toUpperCase() + word.substring(1).toLowerCase())
                .reduce((a, b) -> a + " " + b)
                .orElse(enumVal);
    }
}
