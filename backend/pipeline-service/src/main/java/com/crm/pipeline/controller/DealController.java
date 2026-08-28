package com.crm.pipeline.controller;

import com.crm.pipeline.common.ApiResponse;
import com.crm.pipeline.dto.*;
import com.crm.pipeline.model.*;
import com.crm.pipeline.service.DealService;
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
@RequestMapping("/api/v1/deals")
@RequiredArgsConstructor
@Tag(name = "Sales Pipeline & Deals", description = "Endpoints for managing opportunity stages, revenue forecasting, deal progressions, and win/loss analytics")
public class DealController {

    private final DealService dealService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Search and list sales pipeline deals with multi-criteria filtering")
    public ResponseEntity<ApiResponse<List<DealResponse>>> getAllDeals(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) DealStage stage,
            @RequestParam(required = false) DealType dealType,
            @RequestParam(required = false) DealPriority priority,
            @RequestParam(required = false) Long assignedId
    ) {
        List<DealResponse> deals = dealService.searchDeals(search, stage, dealType, priority, assignedId);
        return ResponseEntity.ok(ApiResponse.ok("Deals retrieved successfully", deals));
    }

    @GetMapping("/pipeline-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get pipeline funnel grouped by stages with stage counts, total values, and weighted revenue")
    public ResponseEntity<ApiResponse<List<PipelineSummaryResponse>>> getPipelineSummary() {
        List<PipelineSummaryResponse> summaries = dealService.getPipelineSummary();
        return ResponseEntity.ok(ApiResponse.ok("Pipeline summary retrieved successfully", summaries));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get executive sales forecasting stats, weighted forecast, win rate %, and closed ARR")
    public ResponseEntity<ApiResponse<DealStatsResponse>> getDealStats() {
        DealStatsResponse stats = dealService.getDealStats();
        return ResponseEntity.ok(ApiResponse.ok("Deal statistics retrieved successfully", stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get single deal details by ID")
    public ResponseEntity<ApiResponse<DealResponse>> getDealById(@PathVariable Long id) {
        DealResponse response = dealService.getDealById(id);
        return ResponseEntity.ok(ApiResponse.ok("Deal retrieved successfully", response));
    }

    @GetMapping("/{id}/products")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get deal product line items")
    public ResponseEntity<ApiResponse<List<DealItemResponse>>> getDealProducts(@PathVariable Long id) {
        List<DealItemResponse> items = dealService.getDealItems(id);
        return ResponseEntity.ok(ApiResponse.ok("Deal products retrieved successfully", items));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create a new sales deal / opportunity")
    public ResponseEntity<ApiResponse<DealResponse>> createDeal(@Valid @RequestBody CreateDealRequest request) {
        DealResponse created = dealService.createDeal(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Deal created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update deal terms and details")
    public ResponseEntity<ApiResponse<DealResponse>> updateDeal(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDealRequest request
    ) {
        DealResponse updated = dealService.updateDeal(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Deal updated successfully", updated));
    }

    @PatchMapping("/{id}/stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Transition deal to a new pipeline stage with auto-weighted revenue updates")
    public ResponseEntity<ApiResponse<DealResponse>> updateDealStage(
            @PathVariable Long id,
            @Valid @RequestBody UpdateDealStageRequest request
    ) {
        DealResponse updated = dealService.updateDealStage(id, request.getStage(), request.getProbability());
        return ResponseEntity.ok(ApiResponse.ok("Deal stage updated successfully", updated));
    }

    @PatchMapping("/{id}/won")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Mark deal as CLOSED WON (100% win)")
    public ResponseEntity<ApiResponse<DealResponse>> closeDealWon(@PathVariable Long id) {
        DealResponse updated = dealService.closeDealWon(id);
        return ResponseEntity.ok(ApiResponse.ok("Deal marked as Closed Won!", updated));
    }

    @PatchMapping("/{id}/lost")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Mark deal as CLOSED LOST with reason")
    public ResponseEntity<ApiResponse<DealResponse>> closeDealLost(
            @PathVariable Long id,
            @Valid @RequestBody CloseDealLostRequest request
    ) {
        DealResponse updated = dealService.closeDealLost(id, request.getLossReason());
        return ResponseEntity.ok(ApiResponse.ok("Deal marked as Closed Lost", updated));
    }

    @GetMapping("/stages/config")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get configurable pipeline stages and win probabilities")
    public ResponseEntity<ApiResponse<List<PipelineStageConfigDTO>>> getStageConfigs() {
        List<PipelineStageConfigDTO> configs = dealService.getAllStageConfigs();
        return ResponseEntity.ok(ApiResponse.ok("Pipeline stage configs retrieved successfully", configs));
    }

    @PutMapping("/stages/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update all pipeline stage configurations and win probabilities (Admin only)")
    public ResponseEntity<ApiResponse<List<PipelineStageConfigDTO>>> updateStageConfigs(
            @Valid @RequestBody List<UpdatePipelineStageConfigRequest> requests
    ) {
        List<PipelineStageConfigDTO> updated = dealService.updateStageConfigs(requests);
        return ResponseEntity.ok(ApiResponse.ok("Pipeline stage configs updated successfully", updated));
    }

    @PutMapping("/stages/config/{stage}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a specific pipeline stage configuration and win probability (Admin only)")
    public ResponseEntity<ApiResponse<PipelineStageConfigDTO>> updateStageConfig(
            @PathVariable DealStage stage,
            @Valid @RequestBody UpdatePipelineStageConfigRequest request
    ) {
        PipelineStageConfigDTO updated = dealService.updateStageConfig(stage, request);
        return ResponseEntity.ok(ApiResponse.ok("Pipeline stage config updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a deal (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteDeal(@PathVariable Long id) {
        dealService.deleteDeal(id);
        return ResponseEntity.ok(ApiResponse.ok("Deal deleted successfully", null));
    }
}
