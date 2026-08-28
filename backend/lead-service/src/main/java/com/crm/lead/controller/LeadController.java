package com.crm.lead.controller;

import com.crm.lead.common.ApiResponse;
import com.crm.lead.dto.*;
import com.crm.lead.model.LeadSource;
import com.crm.lead.model.LeadStatus;
import com.crm.lead.service.LeadService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/leads")
@RequiredArgsConstructor
@Tag(name = "Lead Management & Sales Pipeline", description = "Lead management microservice endpoints")
public class LeadController {

    private final LeadService leadService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create lead", description = "Create a new lead in the CRM pipeline")
    public ResponseEntity<ApiResponse<LeadResponse>> createLead(@Valid @RequestBody CreateLeadRequest request) {
        LeadResponse response = leadService.createLead(request);
        return new ResponseEntity<>(ApiResponse.success("Lead created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get all leads", description = "List leads with dynamic keyword search, status, source, and assigned user filters")
    public ResponseEntity<ApiResponse<List<LeadResponse>>> getAllLeads(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LeadStatus status,
            @RequestParam(required = false) LeadSource source,
            @RequestParam(required = false) Long assignedUserId) {
        List<LeadResponse> leads = leadService.getAllLeads(search, status, source, assignedUserId);
        return ResponseEntity.ok(ApiResponse.success("Leads fetched successfully", leads));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get lead pipeline statistics", description = "Retrieve summary metrics, conversion rates, and stage breakdowns")
    public ResponseEntity<ApiResponse<LeadStatsResponse>> getLeadStats() {
        LeadStatsResponse stats = leadService.getLeadStats();
        return ResponseEntity.ok(ApiResponse.success("Lead stats fetched successfully", stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get lead by ID", description = "Retrieve single lead details")
    public ResponseEntity<ApiResponse<LeadResponse>> getLeadById(@PathVariable Long id) {
        LeadResponse lead = leadService.getLeadById(id);
        return ResponseEntity.ok(ApiResponse.success("Lead fetched successfully", lead));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update lead", description = "Update lead contact and pipeline information")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLead(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLeadRequest request) {
        LeadResponse updated = leadService.updateLead(id, request);
        return ResponseEntity.ok(ApiResponse.success("Lead updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update lead stage", description = "Move lead through pipeline stages")
    public ResponseEntity<ApiResponse<LeadResponse>> updateLeadStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLeadStatusRequest request) {
        LeadResponse updated = leadService.updateLeadStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Lead status updated successfully", updated));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Assign lead", description = "Assign lead to a sales team member (Admin/Manager only)")
    public ResponseEntity<ApiResponse<LeadResponse>> assignLead(
            @PathVariable Long id,
            @Valid @RequestBody AssignLeadRequest request) {
        LeadResponse updated = leadService.assignLead(id, request);
        return ResponseEntity.ok(ApiResponse.success("Lead assigned successfully", updated));
    }

    @PostMapping("/{id}/convert")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Convert lead", description = "Mark lead as converted customer")
    public ResponseEntity<ApiResponse<LeadResponse>> convertLead(@PathVariable Long id) {
        LeadResponse updated = leadService.convertLead(id);
        return ResponseEntity.ok(ApiResponse.success("Lead converted successfully", updated));
    }

    @GetMapping("/{id}/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get lead interested products", description = "Retrieve all products/courses that the lead is interested in")
    public ResponseEntity<ApiResponse<List<LeadProductDTO>>> getLeadProducts(@PathVariable Long id) {
        List<LeadProductDTO> products = leadService.getInterestedProductsForLead(id);
        return ResponseEntity.ok(ApiResponse.success("Lead products fetched successfully", products));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Delete lead", description = "Remove lead from CRM (Admin/Manager only)")
    public ResponseEntity<ApiResponse<Void>> deleteLead(@PathVariable Long id) {
        leadService.deleteLead(id);
        return ResponseEntity.ok(ApiResponse.success("Lead deleted successfully", null));
    }
}
