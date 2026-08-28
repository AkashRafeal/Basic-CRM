package com.crm.call.controller;

import com.crm.call.dto.*;
import com.crm.call.model.*;
import com.crm.call.service.CallLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/calls")
@RequiredArgsConstructor
@Tag(name = "Call Management", description = "APIs for scheduling, logging, and managing inbound and outbound phone calls")
public class CallLogController {

    private final CallLogService callLogService;

    @GetMapping
    @Operation(summary = "Get calls with search, filtering, and pagination")
    public ResponseEntity<Map<String, Object>> getCalls(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CallType callType,
            @RequestParam(required = false) CallStatus status,
            @RequestParam(required = false) CallPurpose purpose,
            @RequestParam(required = false) CallOutcome outcome,
            @RequestParam(required = false) RelatedEntityType relatedToType,
            @RequestParam(required = false) Long relatedToId,
            @RequestParam(required = false) Long assignedToUserId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<CallResponse> callPage = callLogService.getCalls(
                search, callType, status, purpose, outcome, relatedToType, relatedToId, assignedToUserId, fromDate, toDate, PageRequest.of(page, size, sort)
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", callPage.getContent());
        response.put("currentPage", callPage.getNumber());
        response.put("totalItems", callPage.getTotalElements());
        response.put("totalPages", callPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get call details by ID")
    public ResponseEntity<Map<String, Object>> getCallById(@PathVariable Long id) {
        CallResponse call = callLogService.getCallById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", call);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @Operation(summary = "Get call metrics and KPIs")
    public ResponseEntity<Map<String, Object>> getCallStats() {
        CallStatsResponse stats = callLogService.getCallStats();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/today")
    @Operation(summary = "Get today's scheduled calls")
    public ResponseEntity<Map<String, Object>> getTodayScheduledCalls() {
        List<CallResponse> calls = callLogService.getTodayScheduledCalls();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", calls);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/related/{relatedToType}/{relatedToId}")
    @Operation(summary = "Get calls related to a specific entity (e.g., LEAD, CUSTOMER, CONTACT)")
    public ResponseEntity<Map<String, Object>> getCallsByRelatedEntity(
            @PathVariable RelatedEntityType relatedToType,
            @PathVariable Long relatedToId
    ) {
        List<CallResponse> calls = callLogService.getCallsByRelatedEntity(relatedToType, relatedToId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", calls);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @Operation(summary = "Create or schedule a new call")
    public ResponseEntity<Map<String, Object>> createCall(@Valid @RequestBody CreateCallRequest req) {
        CallResponse created = callLogService.createCall(req);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Call log created successfully");
        response.put("data", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/initiate")
    @Operation(summary = "Initiate outbound call to customer using the caller number given by the user")
    public ResponseEntity<Map<String, Object>> initiateOutboundCall(@Valid @RequestBody InitiateCallRequest req) {
        CallResponse initiated = callLogService.initiateCall(req);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Outbound call initiated from " + req.getFromNumber() + " to " + req.getToNumber());
        response.put("data", initiated);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing call log")
    public ResponseEntity<Map<String, Object>> updateCall(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCallRequest req
    ) {
        CallResponse updated = callLogService.updateCall(id, req);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Call log updated successfully");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/outcome")
    @Operation(summary = "Log call outcome, duration, and notes")
    public ResponseEntity<Map<String, Object>> logCallOutcome(
            @PathVariable Long id,
            @Valid @RequestBody LogCallOutcomeRequest req
    ) {
        CallResponse updated = callLogService.logCallOutcome(id, req);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Call outcome logged successfully");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Quickly update call status (e.g. COMPLETED, MISSED, CANCELLED)")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestParam CallStatus status
    ) {
        CallResponse updated = callLogService.updateStatus(id, status);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Call status updated successfully");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a call log")
    public ResponseEntity<Map<String, Object>> deleteCall(@PathVariable Long id) {
        callLogService.deleteCall(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Call log deleted successfully");
        return ResponseEntity.ok(response);
    }
}
