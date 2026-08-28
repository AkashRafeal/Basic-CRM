package com.crm.appointment.controller;

import com.crm.appointment.common.ApiResponse;
import com.crm.appointment.dto.AppointmentResponse;
import com.crm.appointment.dto.NotificationResponse;
import com.crm.appointment.security.UserPrincipal;
import com.crm.appointment.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/notifications", "/api/v1/appointments/notifications"})
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getUserNotifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) com.crm.appointment.model.NotificationType type,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String search) {
        List<NotificationResponse> list = notificationService.getUserNotifications(principal, unreadOnly, type, priority, search);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        long count = notificationService.getUnreadCount(principal);
        return ResponseEntity.ok(ApiResponse.success(Map.of("unreadCount", count)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        NotificationResponse updated = notificationService.markAsRead(id, principal);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        notificationService.markAllAsRead(principal);
        return ResponseEntity.ok(ApiResponse.success("All notifications marked as read", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteNotification(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        notificationService.deleteNotification(id, principal);
        return ResponseEntity.ok(ApiResponse.success("Notification dismissed", null));
    }

    @GetMapping("/reminders/upcoming")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getUpcomingReminders(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<AppointmentResponse> list = notificationService.getUpcomingReminders(principal);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/reminders/send/{appointmentId}")
    public ResponseEntity<ApiResponse<NotificationResponse>> triggerInstantReminder(
            @PathVariable Long appointmentId,
            @AuthenticationPrincipal UserPrincipal principal) {
        NotificationResponse res = notificationService.triggerInstantReminder(appointmentId, principal);
        return ResponseEntity.ok(ApiResponse.success("Meeting reminder dispatched successfully", res));
    }
}
