package com.crm.appointment.controller;

import com.crm.appointment.common.ApiResponse;
import com.crm.appointment.dto.*;
import com.crm.appointment.model.AppointmentStatus;
import com.crm.appointment.model.EntityType;
import com.crm.appointment.model.MeetingMode;
import com.crm.appointment.model.MeetingType;
import com.crm.appointment.security.UserPrincipal;
import com.crm.appointment.service.AppointmentDataExchangeService;
import com.crm.appointment.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment & Meeting Management", description = "Endpoints for scheduling, rescheduling, completing, and managing CRM appointments and meetings")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final AppointmentDataExchangeService dataExchangeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Schedule Appointment", description = "Book an appointment with virtual meeting link and 10-digit attendee validation")
    public ResponseEntity<ApiResponse<AppointmentResponse>> createAppointment(
            @Valid @RequestBody CreateAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AppointmentResponse response = appointmentService.createAppointment(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Appointment scheduled successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "List Appointments", description = "Get paginated appointments with filters and role-based scope")
    public ResponseEntity<Map<String, Object>> getAppointments(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) MeetingType meetingType,
            @RequestParam(required = false) MeetingMode meetingMode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Page<AppointmentResponse> pageResult = appointmentService.getAppointments(
                entityType, entityId, status, meetingType, meetingMode, startDate, endDate, search, page, size, principal
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", pageResult.getContent());
        response.put("currentPage", pageResult.getNumber());
        response.put("totalItems", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/calendar")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Calendar Range", description = "Fetch appointments in date range for calendar views")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getCalendarRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<AppointmentResponse> list = appointmentService.getCalendarRange(start, end, principal);
        return ResponseEntity.ok(ApiResponse.ok("Calendar appointments retrieved successfully", list));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Appointment by ID", description = "Retrieve appointment details by ID")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AppointmentResponse response = appointmentService.getAppointmentById(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Appointment retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update Appointment", description = "Update appointment parameters")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateAppointment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AppointmentResponse response = appointmentService.updateAppointment(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Appointment updated successfully", response));
    }

    @PatchMapping("/{id}/reschedule")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Reschedule Appointment", description = "Update appointment start/end time and transition to RESCHEDULED")
    public ResponseEntity<ApiResponse<AppointmentResponse>> rescheduleAppointment(
            @PathVariable Long id,
            @Valid @RequestBody RescheduleRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AppointmentResponse response = appointmentService.rescheduleAppointment(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Appointment rescheduled successfully", response));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Complete Appointment", description = "Record outcomes and transition to COMPLETED or NO_SHOW")
    public ResponseEntity<ApiResponse<AppointmentResponse>> completeAppointment(
            @PathVariable Long id,
            @Valid @RequestBody CompleteAppointmentRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AppointmentResponse response = appointmentService.completeAppointment(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Appointment outcome saved successfully", response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Cancel Appointment", description = "Cancel meeting with reason")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "Client requested cancellation") String reason,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AppointmentResponse response = appointmentService.cancelAppointment(id, reason, principal);
        return ResponseEntity.ok(ApiResponse.ok("Appointment cancelled successfully", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete Appointment", description = "Hard delete appointment record (Admin Only)")
    public ResponseEntity<ApiResponse<Void>> deleteAppointment(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        appointmentService.deleteAppointment(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Appointment permanently deleted", null));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Appointment Metrics", description = "Fetch role-scoped meeting KPIs and stats")
    public ResponseEntity<ApiResponse<AppointmentStatsResponse>> getStats(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AppointmentStatsResponse stats = appointmentService.getStats(principal);
        return ResponseEntity.ok(ApiResponse.ok("Appointment statistics retrieved successfully", stats));
    }

    @GetMapping("/integrations")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Video & Calendar Integration Status", description = "View active Google Meet, Zoom, Teams and calendar integrations")
    public ResponseEntity<ApiResponse<IntegrationConfigResponse>> getIntegrationConfig(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        IntegrationConfigResponse response = appointmentService.getIntegrationConfig(principal);
        return ResponseEntity.ok(ApiResponse.ok("Integration config retrieved successfully", response));
    }

    @PutMapping("/integrations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Configure Video & Calendar APIs", description = "Configure API keys, webhooks, and domains (Admin Only)")
    public ResponseEntity<ApiResponse<IntegrationConfigResponse>> updateIntegrationConfig(
            @RequestBody IntegrationConfigRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        IntegrationConfigResponse response = appointmentService.updateIntegrationConfig(request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Integration configuration updated successfully", response));
    }

    // ==========================================
    // EXPORT & IMPORT CAPABILITIES
    // ==========================================

    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Export Appointments to CSV", description = "Export filtered or all scheduled meetings matching role scope into RFC 4180 CSV")
    public ResponseEntity<String> exportAppointmentsCsv(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) MeetingType meetingType,
            @RequestParam(required = false) MeetingMode meetingMode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String csv = dataExchangeService.exportAppointmentsCsv(
                entityType, entityId, status, meetingType, meetingMode, startDate, endDate, search, principal
        );
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crm_scheduled_appointments.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }

    @GetMapping("/export/ics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Export Appointments to iCalendar (.ics)", description = "Export meetings to standard RFC 5545 iCalendar feed for Google / Apple / Outlook calendar")
    public ResponseEntity<String> exportAppointmentsIcs(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) MeetingType meetingType,
            @RequestParam(required = false) MeetingMode meetingMode,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String ics = dataExchangeService.exportAppointmentsIcs(
                entityType, entityId, status, meetingType, meetingMode, startDate, endDate, search, principal
        );
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crm_calendar_feed.ics")
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .body(ics);
    }

    @GetMapping("/{id}/export/ics")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Export Single Appointment to .ics", description = "Download single meeting calendar invite (.ics) with virtual room join links")
    public ResponseEntity<String> exportSingleAppointmentIcs(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String ics = dataExchangeService.exportSingleAppointmentIcs(id, principal);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=meeting_" + id + ".ics")
                .contentType(MediaType.parseMediaType("text/calendar; charset=UTF-8"))
                .body(ics);
    }

    @GetMapping("/import/template")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Download CSV Import Template", description = "Get sample CSV template with instructions and pre-filled dummy rows")
    public ResponseEntity<String> getImportTemplate() {
        String template = dataExchangeService.getCsvImportTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=crm_appointments_import_template.csv")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(template);
    }

    @PostMapping(value = "/import/csv", consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.TEXT_PLAIN_VALUE, MediaType.APPLICATION_JSON_VALUE})
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Bulk Import Appointments from CSV", description = "Upload CSV file or raw CSV text to bulk-schedule appointments with 100% validation")
    public ResponseEntity<ApiResponse<ImportResultResponse>> importAppointmentsFromCsv(
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestBody(required = false) Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        String csvContent = "";
        try {
            if (file != null && !file.isEmpty()) {
                csvContent = new String(file.getBytes(), StandardCharsets.UTF_8);
            } else if (body != null && body.containsKey("csvContent")) {
                csvContent = body.get("csvContent");
            } else {
                throw new IllegalArgumentException("No file or csvContent provided for import");
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to read CSV payload: " + e.getMessage());
        }

        ImportResultResponse result = dataExchangeService.importAppointmentsFromCsv(csvContent, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Bulk import completed successfully", result));
    }
}
