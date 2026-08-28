package com.crm.activity.controller;

import com.crm.activity.common.ApiResponse;
import com.crm.activity.dto.ActivityResponse;
import com.crm.activity.dto.ActivityStatsResponse;
import com.crm.activity.dto.CreateActivityRequest;
import com.crm.activity.model.ActivityType;
import com.crm.activity.model.EntityType;
import com.crm.activity.security.UserPrincipal;
import com.crm.activity.service.ActivityLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/activities")
@RequiredArgsConstructor
@Tag(name = "Activity History & Audit Stream", description = "Endpoints for tracking enterprise activity streams, entity timelines, and audit logs")
public class ActivityController {

    private final ActivityLogService activityLogService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Log Activity", description = "Log a manual or automated activity touchpoint")
    public ResponseEntity<ApiResponse<ActivityResponse>> logActivity(
            @Valid @RequestBody CreateActivityRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ActivityResponse response = activityLogService.createActivity(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Activity logged successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Activity Stream", description = "Paginated activity stream with filtering by entity, actor, and activity type")
    public ResponseEntity<Map<String, Object>> getActivities(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) ActivityType activityType,
            @RequestParam(required = false) Long actorId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<ActivityResponse> pageResult = activityLogService.getActivities(
                entityType, entityId, activityType, actorId, search, page, size, principal
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", pageResult.getContent());
        response.put("currentPage", pageResult.getNumber());
        response.put("totalItems", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/timeline/{entityType}/{entityId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Entity Timeline", description = "Fetch all chronological activities for a specific entity (e.g. DEAL, LEAD, CUSTOMER)")
    public ResponseEntity<ApiResponse<List<ActivityResponse>>> getEntityTimeline(
            @PathVariable EntityType entityType,
            @PathVariable Long entityId
    ) {
        List<ActivityResponse> timeline = activityLogService.getEntityTimeline(entityType, entityId);
        return ResponseEntity.ok(ApiResponse.ok("Entity timeline retrieved successfully", timeline));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Activity Metrics & KPIs", description = "Activity counts, breakdown by type, and note statistics")
    public ResponseEntity<ApiResponse<ActivityStatsResponse>> getStats(@AuthenticationPrincipal UserPrincipal principal) {
        ActivityStatsResponse stats = activityLogService.getStats(principal);
        return ResponseEntity.ok(ApiResponse.ok("Activity statistics retrieved successfully", stats));
    }
}
