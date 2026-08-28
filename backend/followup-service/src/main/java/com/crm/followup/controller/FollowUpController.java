package com.crm.followup.controller;

import com.crm.followup.common.ApiResponse;
import com.crm.followup.dto.*;
import com.crm.followup.model.*;
import com.crm.followup.security.UserPrincipal;
import com.crm.followup.service.FollowUpService;
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
@RequestMapping("/api/v1/followups")
@RequiredArgsConstructor
@Tag(name = "Follow-Up Management", description = "Endpoints for managing omnichannel sales touchpoints, follow-up logs, interaction outcomes, and schedule cadences")
public class FollowUpController {

    private final FollowUpService followUpService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Search and list CRM follow-up touchpoints (Admins view organization-wide, Managers view team & unassigned)")
    public ResponseEntity<ApiResponse<List<FollowUpResponse>>> getAllFollowUps(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) FollowUpStatus status,
            @RequestParam(required = false) FollowUpChannel channel,
            @RequestParam(required = false) FollowUpOutcome outcome,
            @RequestParam(required = false) FollowUpPriority priority,
            @RequestParam(required = false) Long assignedId,
            @RequestParam(required = false) TargetType targetType,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<FollowUpResponse> list = followUpService.searchFollowUps(
                search, status, channel, outcome, priority, assignedId, targetType, principal
        );
        return ResponseEntity.ok(ApiResponse.ok("Follow-ups retrieved successfully", list));
    }

    @GetMapping("/my-schedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get upcoming follow-up schedule for the currently authenticated sales rep")
    public ResponseEntity<ApiResponse<List<FollowUpResponse>>> getMySchedule(@AuthenticationPrincipal UserPrincipal principal) {
        List<FollowUpResponse> list = followUpService.getMySchedule(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("My follow-up schedule retrieved successfully", list));
    }

    @GetMapping("/unassigned")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get list of unassigned follow-ups ready for assignment or rep claiming")
    public ResponseEntity<ApiResponse<List<FollowUpResponse>>> getUnassignedFollowUps() {
        List<FollowUpResponse> list = followUpService.getUnassignedFollowUps();
        return ResponseEntity.ok(ApiResponse.ok("Unassigned follow-ups retrieved successfully", list));
    }

    @PatchMapping("/{id}/claim")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Claim an unassigned follow-up task for the authenticated representative")
    public ResponseEntity<ApiResponse<FollowUpResponse>> claimFollowUp(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        FollowUpResponse claimed = followUpService.claimFollowUp(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up claimed successfully", claimed));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get follow-up metrics, today's schedule count, missed logs, and outcome conversion stats scoped to user role")
    public ResponseEntity<ApiResponse<FollowUpStatsResponse>> getFollowUpStats(@AuthenticationPrincipal UserPrincipal principal) {
        FollowUpStatsResponse stats = followUpService.getFollowUpStats(principal);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up statistics retrieved successfully", stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get single follow-up details by ID")
    public ResponseEntity<ApiResponse<FollowUpResponse>> getFollowUpById(@PathVariable Long id) {
        FollowUpResponse response = followUpService.getFollowUpById(id);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up retrieved successfully", response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Schedule a new follow-up interaction")
    public ResponseEntity<ApiResponse<FollowUpResponse>> createFollowUp(
            @Valid @RequestBody CreateFollowUpRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        FollowUpResponse created = followUpService.createFollowUp(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Follow-up scheduled successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update follow-up touchpoint details")
    public ResponseEntity<ApiResponse<FollowUpResponse>> updateFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody UpdateFollowUpRequest request
    ) {
        FollowUpResponse updated = followUpService.updateFollowUp(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up updated successfully", updated));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Complete follow-up interaction and record outcome (Reps can only log own assigned touchpoints)")
    public ResponseEntity<ApiResponse<FollowUpResponse>> completeFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody CompleteFollowUpRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        FollowUpResponse completed = followUpService.completeFollowUp(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up completed and outcome logged successfully", completed));
    }

    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Reschedule follow-up to a new date and time")
    public ResponseEntity<ApiResponse<FollowUpResponse>> rescheduleFollowUp(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleFollowUpRequest request
    ) {
        FollowUpResponse rescheduled = followUpService.rescheduleFollowUp(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up rescheduled successfully", rescheduled));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a follow-up record (Restricted strictly to Administrators to preserve audit trail)")
    public ResponseEntity<ApiResponse<Void>> deleteFollowUp(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") Boolean permanent,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        followUpService.deleteFollowUp(id, principal, permanent);
        return ResponseEntity.ok(ApiResponse.ok("Follow-up deleted successfully", null));
    }

    @GetMapping("/cadences/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get follow-up cadence rules and sequence intervals (Admin only)")
    public ResponseEntity<ApiResponse<CadenceConfigDTO>> getCadenceConfigs() {
        CadenceConfigDTO config = followUpService.getCadenceConfigs();
        return ResponseEntity.ok(ApiResponse.ok("Cadence configuration retrieved successfully", config));
    }

    @PutMapping("/cadences/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update follow-up cadence rules and sequence intervals (Admin only)")
    public ResponseEntity<ApiResponse<CadenceConfigDTO>> updateCadenceConfigs(
            @Valid @RequestBody UpdateCadenceConfigRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        CadenceConfigDTO config = followUpService.updateCadenceConfigs(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Cadence configuration updated successfully", config));
    }
}
