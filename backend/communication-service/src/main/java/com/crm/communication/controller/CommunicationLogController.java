package com.crm.communication.controller;

import com.crm.communication.dto.*;
import com.crm.communication.model.*;
import com.crm.communication.security.UserPrincipal;
import com.crm.communication.service.CommunicationLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/communications")
@RequiredArgsConstructor
@Tag(name = "Communications", description = "Omnichannel Communication, Inbox, and Messaging Management APIs")
public class CommunicationLogController {

    private final CommunicationLogService service;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get paginated communications with filtering, search, and role scoping")
    public ResponseEntity<Map<String, Object>> getCommunications(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) CommunicationChannel channel,
            @RequestParam(required = false) CommunicationDirection direction,
            @RequestParam(required = false) MessageStatus status,
            @RequestParam(required = false) RelatedEntityType relatedToType,
            @RequestParam(required = false) Boolean isStarred,
            @RequestParam(required = false) Boolean isRead,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CommunicationResponse> result = service.getCommunications(
                query, channel, direction, status, relatedToType, isStarred, isRead, principal, pageable
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", result.getContent());
        response.put("currentPage", result.getNumber());
        response.put("totalItems", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get communication log by ID")
    public ResponseEntity<Map<String, Object>> getCommunicationById(@PathVariable Long id) {
        CommunicationResponse response = service.getCommunicationById(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @GetMapping("/thread/{threadId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get all messages in a conversation thread")
    public ResponseEntity<Map<String, Object>> getThreadMessages(@PathVariable String threadId) {
        List<CommunicationResponse> list = service.getThreadMessages(threadId);
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    @GetMapping("/related/{type}/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get communications linked to a specific CRM entity")
    public ResponseEntity<Map<String, Object>> getByRelatedEntity(
            @PathVariable RelatedEntityType type,
            @PathVariable Long id
    ) {
        List<CommunicationResponse> list = service.getCommunicationsByRelatedEntity(type, id);
        return ResponseEntity.ok(Map.of("success", true, "data", list));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get communication summary analytics and channel distribution scoped to user role")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal UserPrincipal principal) {
        CommunicationStatsResponse stats = service.getStats(principal);
        return ResponseEntity.ok(Map.of("success", true, "data", stats));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create or log a communication message")
    public ResponseEntity<Map<String, Object>> createCommunication(@Valid @RequestBody CreateCommunicationRequest request) {
        CommunicationResponse response = service.createCommunication(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "data", response));
    }

    @PostMapping("/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Send an omnichannel message instantly (Email, SMS, WhatsApp, Chat)")
    public ResponseEntity<Map<String, Object>> sendMessage(@Valid @RequestBody SendMessageRequest request) {
        CommunicationResponse response = service.sendMessage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("success", true, "data", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update communication details")
    public ResponseEntity<Map<String, Object>> updateCommunication(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCommunicationRequest request
    ) {
        CommunicationResponse response = service.updateCommunication(id, request);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PatchMapping("/{id}/star")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Toggle star status on a communication message")
    public ResponseEntity<Map<String, Object>> toggleStar(@PathVariable Long id) {
        CommunicationResponse response = service.toggleStar(id);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Mark communication as read or unread")
    public ResponseEntity<Map<String, Object>> markRead(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean isRead
    ) {
        CommunicationResponse response = service.markRead(id, isRead);
        return ResponseEntity.ok(Map.of("success", true, "data", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete communication record (Restricted to Administrators)")
    public ResponseEntity<Map<String, Object>> deleteCommunication(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        service.deleteCommunication(id, principal);
        return ResponseEntity.ok(Map.of("success", true, "message", "Communication log deleted successfully"));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Export communication logs to CSV (Company-wide for Admin, Team for Manager, Restricted for Employee)")
    public ResponseEntity<String> exportCommunicationsCsv(@AuthenticationPrincipal UserPrincipal principal) {
        String csv = service.exportCommunicationsCsv(principal);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crm_communication_logs.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/gateways/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get omnichannel gateway configurations (Admin only)")
    public ResponseEntity<Map<String, Object>> getGatewayConfigs() {
        GatewayConfigDTO config = service.getGatewayConfigs();
        return ResponseEntity.ok(Map.of("success", true, "data", config));
    }

    @PutMapping("/gateways/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update omnichannel gateway configurations (Admin only)")
    public ResponseEntity<Map<String, Object>> updateGatewayConfigs(
            @Valid @RequestBody UpdateGatewayConfigRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        GatewayConfigDTO config = service.updateGatewayConfigs(request, principal);
        return ResponseEntity.ok(Map.of("success", true, "data", config));
    }
}
