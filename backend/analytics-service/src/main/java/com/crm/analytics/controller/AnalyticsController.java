package com.crm.analytics.controller;

import com.crm.analytics.common.ApiResponse;
import com.crm.analytics.dto.*;
import com.crm.analytics.security.UserPrincipal;
import com.crm.analytics.service.AnalyticsService;
import com.crm.analytics.service.CsvExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Reports & Business Intelligence", description = "Cross-service executive reporting, sales forecasting, rep performance, and data exports")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CsvExportService csvExportService;

    @GetMapping("/executive-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get executive summary scoped to user role (Company, Team, or Personal)")
    public ResponseEntity<ApiResponse<ExecutiveSummaryReport>> getExecutiveSummary(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ExecutiveSummaryReport report = analyticsService.getExecutiveSummaryReport(principal);
        return ResponseEntity.ok(ApiResponse.ok("Executive report generated successfully", report));
    }

    @GetMapping("/sales-performance")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get sales velocity and revenue distributions scoped to user role")
    public ResponseEntity<ApiResponse<SalesPerformanceReport>> getSalesPerformance(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        SalesPerformanceReport report = analyticsService.getSalesPerformanceReport(principal);
        return ResponseEntity.ok(ApiResponse.ok("Sales performance report generated successfully", report));
    }

    @GetMapping("/team-leaderboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get sales representative leaderboard scorecards (Company-wide, Team, or Personal scorecard)")
    public ResponseEntity<ApiResponse<TeamLeaderboardReport>> getTeamLeaderboard(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TeamLeaderboardReport report = analyticsService.getTeamLeaderboardReport(principal);
        return ResponseEntity.ok(ApiResponse.ok("Team leaderboard generated successfully", report));
    }

    @GetMapping("/lead-sources")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get lead acquisition channel metrics and conversion ROI scoped to user role")
    public ResponseEntity<ApiResponse<LeadSourceReport>> getLeadSources(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        LeadSourceReport report = analyticsService.getLeadSourceReport(principal);
        return ResponseEntity.ok(ApiResponse.ok("Lead source report generated successfully", report));
    }

    @GetMapping("/customer-industries")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get customer portfolio ARR distribution across industries (Restricted to Admins and Managers)")
    public ResponseEntity<ApiResponse<CustomerIndustryReport>> getCustomerIndustries(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CustomerIndustryReport report = analyticsService.getCustomerIndustryReport(principal);
        return ResponseEntity.ok(ApiResponse.ok("Customer industry report generated successfully", report));
    }

    @GetMapping("/reports/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get product-level pipeline, revenue, lead interest, and conversion metrics")
    public ResponseEntity<ApiResponse<ProductPerformanceReport>> getProductPerformance(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ProductPerformanceReport report = analyticsService.getProductPerformanceReport(principal);
        return ResponseEntity.ok(ApiResponse.ok("Product performance report generated successfully", report));
    }

    @GetMapping("/export/deals")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Export deals data to CSV (Company-wide for Admin, Team for Manager, Restricted for Employee)")
    public ResponseEntity<String> exportDealsCsv(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String csv = csvExportService.exportDealsCsv(principal);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crm_deals_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/export/customers")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Export customer portfolio to CSV (Company-wide for Admin, Team for Manager, Restricted for Employee)")
    public ResponseEntity<String> exportCustomersCsv(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String csv = csvExportService.exportCustomersCsv(principal);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crm_customers_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/export/leads")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Export leads pipeline to CSV (Company-wide for Admin, Team for Manager, Restricted for Employee)")
    public ResponseEntity<String> exportLeadsCsv(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String csv = csvExportService.exportLeadsCsv(principal);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crm_leads_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }
}
