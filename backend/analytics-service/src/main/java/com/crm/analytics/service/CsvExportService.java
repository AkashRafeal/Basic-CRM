package com.crm.analytics.service;

import com.crm.analytics.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvExportService {

    private final JdbcTemplate jdbcTemplate;
    private final AnalyticsService analyticsService;

    public String exportDealsCsv(UserPrincipal principal) {
        AnalyticsService.UserScope scope = analyticsService.resolveScope(principal);
        if (scope.isEmployee) {
            throw new AccessDeniedException("Data export is disabled for Sales Representatives to prevent unauthorized data exfiltration.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Deal ID,Deal Name,Stage,Amount (₹),Probability (%),Expected Revenue (₹),Close Date,Deal Type,Priority,Customer,Assigned Rep\n");

        String sql = "SELECT id, deal_name, stage, amount, probability, expected_revenue, expected_close_date, deal_type, priority, customer_name, assigned_to_user_name FROM crm_deals" +
                (scope.isAdmin ? "" : " WHERE assigned_to_user_id IN (" + scope.getSqlInClause() + ")") +
                " ORDER BY id ASC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        for (Map<String, Object> r : rows) {
            sb.append(escapeCsv(r.get("id"))).append(",")
              .append(escapeCsv(r.get("deal_name"))).append(",")
              .append(escapeCsv(r.get("stage"))).append(",")
              .append(escapeCsv(r.get("amount"))).append(",")
              .append(escapeCsv(r.get("probability"))).append(",")
              .append(escapeCsv(r.get("expected_revenue"))).append(",")
              .append(escapeCsv(r.get("expected_close_date"))).append(",")
              .append(escapeCsv(r.get("deal_type"))).append(",")
              .append(escapeCsv(r.get("priority"))).append(",")
              .append(escapeCsv(r.get("customer_name"))).append(",")
              .append(escapeCsv(r.get("assigned_to_user_name"))).append("\n");
        }

        return sb.toString();
    }

    public String exportCustomersCsv(UserPrincipal principal) {
        AnalyticsService.UserScope scope = analyticsService.resolveScope(principal);
        if (scope.isEmployee) {
            throw new AccessDeniedException("Data export is disabled for Sales Representatives to prevent unauthorized data exfiltration.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Customer ID,Company Name,Contact Person,Email,Phone,Industry,Tier,Status,Annual ARR (₹),Account Manager\n");

        String sql = "SELECT id, name, contact_person, email, phone, industry, customer_tier, customer_status, annual_revenue, assigned_account_manager_name FROM crm_customers" +
                (scope.isAdmin ? " WHERE is_deleted = false" :
                 " WHERE is_deleted = false AND (assigned_account_manager_id IN (" + scope.getSqlInClause() + ") OR id IN (SELECT DISTINCT customer_id FROM crm_deals WHERE assigned_to_user_id IN (" + scope.getSqlInClause() + ") AND customer_id IS NOT NULL))") +
                " ORDER BY id ASC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        for (Map<String, Object> r : rows) {
            sb.append(escapeCsv(r.get("id"))).append(",")
              .append(escapeCsv(r.get("name"))).append(",")
              .append(escapeCsv(r.get("contact_person"))).append(",")
              .append(escapeCsv(r.get("email"))).append(",")
              .append(escapeCsv(r.get("phone"))).append(",")
              .append(escapeCsv(r.get("industry"))).append(",")
              .append(escapeCsv(r.get("customer_tier"))).append(",")
              .append(escapeCsv(r.get("customer_status"))).append(",")
              .append(escapeCsv(r.get("annual_revenue"))).append(",")
              .append(escapeCsv(r.get("assigned_account_manager_name"))).append("\n");
        }

        return sb.toString();
    }

    public String exportLeadsCsv(UserPrincipal principal) {
        AnalyticsService.UserScope scope = analyticsService.resolveScope(principal);
        if (scope.isEmployee) {
            throw new AccessDeniedException("Data export is disabled for Sales Representatives to prevent unauthorized data exfiltration.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Lead ID,Full Name,Email,Phone,Company,Job Title,Status,Source,Estimated Value (₹),Score,Assigned Rep\n");

        String sql = "SELECT id, first_name, last_name, email, phone, company, job_title, lead_status, lead_source, estimated_value, score, assigned_to_user_name FROM crm_leads" +
                (scope.isAdmin ? " WHERE is_archived = false" : " WHERE is_archived = false AND assigned_to_user_id IN (" + scope.getSqlInClause() + ")") +
                " ORDER BY id ASC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);

        for (Map<String, Object> r : rows) {
            String fn = (String) r.get("first_name");
            String ln = (String) r.get("last_name");
            String fullName = ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim();

            sb.append(escapeCsv(r.get("id"))).append(",")
              .append(escapeCsv(fullName)).append(",")
              .append(escapeCsv(r.get("email"))).append(",")
              .append(escapeCsv(r.get("phone"))).append(",")
              .append(escapeCsv(r.get("company"))).append(",")
              .append(escapeCsv(r.get("job_title"))).append(",")
              .append(escapeCsv(r.get("lead_status"))).append(",")
              .append(escapeCsv(r.get("lead_source"))).append(",")
              .append(escapeCsv(r.get("estimated_value"))).append(",")
              .append(escapeCsv(r.get("score"))).append(",")
              .append(escapeCsv(r.get("assigned_to_user_name"))).append("\n");
        }

        return sb.toString();
    }

    private String escapeCsv(Object val) {
        if (val == null) return "";
        String str = val.toString();
        if (str.contains(",") || str.contains("\"") || str.contains("\n")) {
            return "\"" + str.replace("\"", "\"\"") + "\"";
        }
        return str;
    }
}
