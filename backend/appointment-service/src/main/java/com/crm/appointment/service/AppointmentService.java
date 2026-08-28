package com.crm.appointment.service;

import com.crm.appointment.dto.*;
import com.crm.appointment.model.*;
import com.crm.appointment.repository.AppointmentRepository;
import com.crm.appointment.security.UserPrincipal;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final com.crm.appointment.repository.IntegrationConfigRepository integrationConfigRepository;
    private final NotificationService notificationService;

    @Transactional
    public AppointmentResponse createAppointment(CreateAppointmentRequest request, UserPrincipal principal) {
        Long organizerId = principal != null && principal.getId() != null ? principal.getId() : 1L;
        String organizerName = principal != null && principal.getName() != null ? principal.getName() : "System User";
        String organizerEmail = principal != null ? principal.getEmail() : null;
        String organizerRole = principal != null && principal.getRole() != null ? principal.getRole() : "ROLE_ADMIN";
        Long organizerDeptId = principal != null ? principal.getDepartmentId() : null;

        // Role-Based Host Assignment Rules:
        // Employee: Cannot reassign host (must be self)
        // Manager: Can schedule for team members or self
        // Admin: Can schedule for any rep/executive
        if (request.getOrganizerId() != null && principal != null) {
            if (!principal.isAdmin() && !principal.isManager()) {
                if (!request.getOrganizerId().equals(principal.getId())) {
                    throw new AccessDeniedException("Sales Representatives cannot reassign or schedule meetings for other hosts");
                }
            } else {
                organizerId = request.getOrganizerId();
            }
        }

        int duration = request.getDurationMinutes() != null && request.getDurationMinutes() > 0 ? request.getDurationMinutes() : 30;
        if (duration < 5 || duration > 480) {
            throw new IllegalArgumentException("Meeting duration must be between 5 minutes and 8 hours (480 minutes).");
        }

        LocalDateTime startTime = request.getStartTime();

        // Strict Business Rule: Meetings must strictly be scheduled for the future (no past dates or past times)
        if (startTime == null || startTime.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new IllegalArgumentException("Meetings cannot be scheduled for past dates or past times. Please choose an upcoming future time slot.");
        }

        LocalDateTime endTime = request.getEndTime() != null ? request.getEndTime() : startTime.plusMinutes(duration);
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("Meeting end time must be strictly after the start time.");
        }

        // Auto-generate virtual meeting link if not supplied
        String meetingLink = request.getMeetingLink();
        if ((meetingLink == null || meetingLink.isBlank()) &&
                (request.getMeetingMode() == MeetingMode.VIRTUAL_GOOGLE_MEET ||
                 request.getMeetingMode() == MeetingMode.VIRTUAL_ZOOM ||
                 request.getMeetingMode() == MeetingMode.VIRTUAL_MS_TEAMS)) {
            String code = UUID.randomUUID().toString().substring(0, 8);
            if (request.getMeetingMode() == MeetingMode.VIRTUAL_ZOOM) {
                meetingLink = "https://zoom.us/j/98" + code.replaceAll("[^0-9]", "7");
            } else {
                meetingLink = "https://meet.google.com/" + code.substring(0, 3) + "-" + code.substring(3, 7) + "-" + code.substring(7);
            }
        }

        Appointment appt = Appointment.builder()
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .meetingType(request.getMeetingType())
                .status(AppointmentStatus.SCHEDULED)
                .meetingMode(request.getMeetingMode())
                .meetingLink(meetingLink)
                .location(request.getLocation())
                .startTime(startTime)
                .endTime(endTime)
                .durationMinutes(duration)
                .timeZone(request.getTimeZone() != null ? request.getTimeZone() : "Asia/Kolkata")
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .entityTitle(request.getEntityTitle())
                .organizerId(organizerId)
                .organizerName(organizerName)
                .organizerEmail(organizerEmail)
                .organizerRole(organizerRole)
                .organizerDepartmentId(organizerDeptId)
                .attendeeName(request.getAttendeeName().trim())
                .attendeeEmail(request.getAttendeeEmail().trim())
                .attendeePhone(request.getAttendeePhone())
                .externalGuests(request.getExternalGuests())
                .build();

        Appointment saved = appointmentRepository.save(appt);
        log.info("Scheduled Appointment ID: {} ('{}') for {} with {} on {}",
                saved.getId(), saved.getTitle(), saved.getOrganizerName(), saved.getAttendeeName(), saved.getStartTime());

        try {
            notificationService.createNotification(
                    saved.getOrganizerId(),
                    saved.getOrganizerEmail(),
                    saved.getOrganizerName(),
                    "📅 Meeting Scheduled: " + saved.getTitle(),
                    "Your meeting with " + saved.getAttendeeName() + " (" + saved.getAttendeeEmail() + ") is scheduled for " + saved.getStartTime(),
                    com.crm.appointment.model.NotificationType.MEETING_SCHEDULED,
                    "MEDIUM",
                    saved.getId(),
                    saved.getMeetingLink(),
                    saved.getStartTime()
            );
        } catch (Exception e) {
            log.warn("Failed to generate meeting scheduled notification: {}", e.getMessage());
        }

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<AppointmentResponse> getAppointments(
            EntityType entityType,
            Long entityId,
            AppointmentStatus status,
            MeetingType meetingType,
            MeetingMode meetingMode,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            int page,
            int size,
            UserPrincipal principal
    ) {
        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (entityType != null) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (meetingType != null) {
                predicates.add(cb.equal(root.get("meetingType"), meetingType));
            }
            if (meetingMode != null) {
                predicates.add(cb.equal(root.get("meetingMode"), meetingMode));
            }
            if (startDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("startTime"), startDate));
            }
            if (endDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("startTime"), endDate));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term);
                Predicate attendeeMatch = cb.like(cb.lower(root.get("attendeeName")), term);
                Predicate emailMatch = cb.like(cb.lower(root.get("attendeeEmail")), term);
                Predicate phoneMatch = cb.like(cb.lower(root.get("attendeePhone")), term);
                Predicate locationMatch = cb.like(cb.lower(root.get("location")), term);
                Predicate entityTitleMatch = cb.like(cb.lower(root.get("entityTitle")), term);
                Predicate orgMatch = cb.like(cb.lower(root.get("organizerName")), term);
                predicates.add(cb.or(titleMatch, attendeeMatch, emailMatch, phoneMatch, locationMatch, entityTitleMatch, orgMatch));
            }

            // Role-Based Access Scoping:
            // Admin: All company appointments
            // Manager: Team / department appointments & own
            // Employee: Own organized / assigned meetings
            if (principal != null && !principal.isAdmin()) {
                if (principal.isManager()) {
                    if (principal.getDepartmentId() != null) {
                        Predicate deptMatch = cb.equal(root.get("organizerDepartmentId"), principal.getDepartmentId());
                        Predicate selfMatch = cb.equal(root.get("organizerId"), principal.getId());
                        predicates.add(cb.or(deptMatch, selfMatch));
                    } else {
                        predicates.add(cb.equal(root.get("organizerId"), principal.getId()));
                    }
                } else {
                    predicates.add(cb.equal(root.get("organizerId"), principal.getId()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startTime"));
        return appointmentRepository.findAll(spec, pageable).map(AppointmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<AppointmentResponse> getCalendarRange(LocalDateTime start, LocalDateTime end, UserPrincipal principal) {
        Specification<Appointment> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.between(root.get("startTime"), start, end));

            if (principal != null && !principal.isAdmin()) {
                if (principal.isManager()) {
                    if (principal.getDepartmentId() != null) {
                        Predicate deptMatch = cb.equal(root.get("organizerDepartmentId"), principal.getDepartmentId());
                        Predicate selfMatch = cb.equal(root.get("organizerId"), principal.getId());
                        predicates.add(cb.or(deptMatch, selfMatch));
                    } else {
                        predicates.add(cb.equal(root.get("organizerId"), principal.getId()));
                    }
                } else {
                    predicates.add(cb.equal(root.get("organizerId"), principal.getId()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return appointmentRepository.findAll(spec, Sort.by(Sort.Direction.ASC, "startTime"))
                .stream()
                .map(AppointmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AppointmentResponse getAppointmentById(Long id, UserPrincipal principal) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        // RBAC validation
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = appt.getOrganizerId().equals(principal.getId());
                boolean isDept = principal.getDepartmentId() != null && principal.getDepartmentId().equals(appt.getOrganizerDepartmentId());
                if (!isOwn && !isDept) {
                    throw new AccessDeniedException("Access denied: You can only view appointments for your department team");
                }
            } else {
                if (!appt.getOrganizerId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: You can only view your own scheduled meetings");
                }
            }
        }

        return AppointmentResponse.fromEntity(appt);
    }

    @Transactional
    public AppointmentResponse updateAppointment(Long id, UpdateAppointmentRequest request, UserPrincipal principal) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        // Permissions check
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = appt.getOrganizerId().equals(principal.getId());
                boolean isDept = principal.getDepartmentId() != null && principal.getDepartmentId().equals(appt.getOrganizerDepartmentId());
                if (!isOwn && !isDept) {
                    throw new AccessDeniedException("Access denied: Managers can only edit appointments within their team portfolio");
                }
            } else {
                if (!appt.getOrganizerId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: Sales Representatives can only edit their own scheduled appointments");
                }
            }
        }

        // Host reassignment authorization checks:
        if (request.getOrganizerId() != null && !request.getOrganizerId().equals(appt.getOrganizerId())) {
            if (principal != null && !principal.isAdmin() && !principal.isManager()) {
                throw new AccessDeniedException("Sales Representatives cannot reassign meeting host");
            }
            appt.setOrganizerId(request.getOrganizerId());
            if (request.getOrganizerName() != null && !request.getOrganizerName().isBlank()) {
                appt.setOrganizerName(request.getOrganizerName().trim());
            }
        }

        if (request.getTitle() != null) appt.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) appt.setDescription(request.getDescription());
        if (request.getMeetingType() != null) appt.setMeetingType(request.getMeetingType());
        if (request.getStatus() != null) appt.setStatus(request.getStatus());
        if (request.getMeetingMode() != null) appt.setMeetingMode(request.getMeetingMode());
        if (request.getMeetingLink() != null) appt.setMeetingLink(request.getMeetingLink());
        if (request.getLocation() != null) appt.setLocation(request.getLocation());
        if (request.getStartTime() != null) {
            if (request.getStartTime().toLocalDate().isBefore(LocalDate.now())) {
                throw new IllegalArgumentException("Meeting start time cannot be updated to a past date. Date must be today or an upcoming date.");
            }
            if (request.getStartTime().toLocalDate().isEqual(LocalDate.now()) && request.getStartTime().toLocalTime().isBefore(LocalTime.now().minusMinutes(5))) {
                throw new IllegalArgumentException("Meeting start time cannot be updated to a past time.");
            }
            appt.setStartTime(request.getStartTime());
        }
        if (request.getEndTime() != null) appt.setEndTime(request.getEndTime());
        if (request.getDurationMinutes() != null) {
            if (request.getDurationMinutes() < 5 || request.getDurationMinutes() > 480) {
                throw new IllegalArgumentException("Meeting duration must be between 5 minutes and 8 hours.");
            }
            appt.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getTimeZone() != null) appt.setTimeZone(request.getTimeZone());
        if (request.getEntityType() != null) appt.setEntityType(request.getEntityType());
        if (request.getEntityId() != null) appt.setEntityId(request.getEntityId());
        if (request.getEntityTitle() != null) appt.setEntityTitle(request.getEntityTitle());
        if (request.getAttendeeName() != null) appt.setAttendeeName(request.getAttendeeName().trim());
        if (request.getAttendeeEmail() != null) appt.setAttendeeEmail(request.getAttendeeEmail().trim());
        if (request.getAttendeePhone() != null) appt.setAttendeePhone(request.getAttendeePhone());
        if (request.getExternalGuests() != null) appt.setExternalGuests(request.getExternalGuests());
        if (request.getOutcomeNotes() != null) appt.setOutcomeNotes(request.getOutcomeNotes());
        if (request.getActionItems() != null) appt.setActionItems(request.getActionItems());
        if (request.getCancellationReason() != null) appt.setCancellationReason(request.getCancellationReason());
        if (request.getRecordingUrl() != null) appt.setRecordingUrl(request.getRecordingUrl());

        Appointment updated = appointmentRepository.save(appt);
        if (updated.getStatus() == AppointmentStatus.COMPLETED ||
            updated.getStatus() == AppointmentStatus.CANCELLED ||
            updated.getStatus() == AppointmentStatus.NO_SHOW) {
            notificationService.deleteNotificationsForAppointment(updated.getId());
        }
        log.info("Updated Appointment ID: {} by {}", updated.getId(), principal != null ? principal.getName() : "System");
        return AppointmentResponse.fromEntity(updated);
    }

    @Transactional
    public AppointmentResponse rescheduleAppointment(Long id, RescheduleRequest request, UserPrincipal principal) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        // Check permission
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = appt.getOrganizerId().equals(principal.getId());
                boolean isDept = principal.getDepartmentId() != null && principal.getDepartmentId().equals(appt.getOrganizerDepartmentId());
                if (!isOwn && !isDept) {
                    throw new AccessDeniedException("Access denied: You can only reschedule team appointments");
                }
            } else {
                if (!appt.getOrganizerId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: You can only reschedule your own meetings");
                }
                if (appt.getStartTime().toLocalDate().isBefore(LocalDate.now())) {
                    throw new AccessDeniedException("Historical or past meetings cannot be rescheduled. Only today or upcoming meetings can be modified.");
                }
            }
        }

        LocalDateTime newStart = request.getNewStartTime();
        // Strict Business Rule: Cannot reschedule to past dates or past times
        if (newStart == null || newStart.isBefore(LocalDateTime.now().minusMinutes(1))) {
            throw new IllegalArgumentException("Rescheduled meeting time cannot be in the past. Please select an upcoming future time slot.");
        }

        int duration = request.getNewDurationMinutes() != null && request.getNewDurationMinutes() > 0
                ? request.getNewDurationMinutes() : appt.getDurationMinutes();
        LocalDateTime newEnd = request.getNewEndTime() != null ? request.getNewEndTime() : newStart.plusMinutes(duration);

        appt.setStartTime(newStart);
        appt.setEndTime(newEnd);
        appt.setDurationMinutes(duration);
        appt.setStatus(AppointmentStatus.RESCHEDULED);
        if (request.getReason() != null && !request.getReason().isBlank()) {
            appt.setDescription((appt.getDescription() != null ? appt.getDescription() + "\n" : "") + "[Rescheduled: " + request.getReason() + "]");
        }

        Appointment saved = appointmentRepository.save(appt);
        log.info("Rescheduled Appointment ID {} to {}", id, newStart);

        try {
            notificationService.createNotification(
                    saved.getOrganizerId(),
                    saved.getOrganizerEmail(),
                    saved.getOrganizerName(),
                    "🔄 Meeting Rescheduled: " + saved.getTitle(),
                    "Meeting with " + saved.getAttendeeName() + " was rescheduled to " + saved.getStartTime() + (request.getReason() != null ? " (" + request.getReason() + ")" : ""),
                    com.crm.appointment.model.NotificationType.MEETING_RESCHEDULED,
                    "HIGH",
                    saved.getId(),
                    saved.getMeetingLink(),
                    saved.getStartTime()
            );
        } catch (Exception e) {
            log.warn("Failed to generate reschedule notification: {}", e.getMessage());
        }

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse completeAppointment(Long id, CompleteAppointmentRequest request, UserPrincipal principal) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = appt.getOrganizerId().equals(principal.getId());
                boolean isDept = principal.getDepartmentId() != null && principal.getDepartmentId().equals(appt.getOrganizerDepartmentId());
                if (!isOwn && !isDept) {
                    throw new AccessDeniedException("Access denied: You can only complete team appointments");
                }
            } else {
                if (!appt.getOrganizerId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: You can only complete your own meetings");
                }
            }
        }

        if (request.isNoShow()) {
            appt.setStatus(AppointmentStatus.NO_SHOW);
        } else {
            appt.setStatus(AppointmentStatus.COMPLETED);
        }

        if (request.getOutcomeNotes() != null) appt.setOutcomeNotes(request.getOutcomeNotes());
        if (request.getActionItems() != null) appt.setActionItems(request.getActionItems());
        if (request.getRecordingUrl() != null) appt.setRecordingUrl(request.getRecordingUrl());

        Appointment saved = appointmentRepository.save(appt);
        // Automatically remove active notifications for completed/closed meetings
        notificationService.deleteNotificationsForAppointment(saved.getId());
        log.info("Marked Appointment ID {} as {} by {}", id, saved.getStatus(), principal != null ? principal.getName() : "System");
        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional
    public AppointmentResponse cancelAppointment(Long id, String reason, UserPrincipal principal) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = appt.getOrganizerId().equals(principal.getId());
                boolean isDept = principal.getDepartmentId() != null && principal.getDepartmentId().equals(appt.getOrganizerDepartmentId());
                if (!isOwn && !isDept) {
                    throw new AccessDeniedException("Access denied: You can only cancel team appointments");
                }
            } else {
                if (!appt.getOrganizerId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: You can only cancel your own meetings");
                }
                // Strict Rule: Employee can cancel own meetings for today or upcoming dates
                if (appt.getStartTime().toLocalDate().isBefore(LocalDate.now())) {
                    throw new AccessDeniedException("Historical or past meetings cannot be cancelled. Only today or upcoming meetings can be cancelled.");
                }
            }
        }

        appt.setStatus(AppointmentStatus.CANCELLED);
        appt.setCancellationReason(reason);

        Appointment saved = appointmentRepository.save(appt);
        // Automatically remove active notifications for cancelled meetings
        notificationService.deleteNotificationsForAppointment(saved.getId());
        log.info("Cancelled Appointment ID {} with reason: {}", id, reason);

        try {
            notificationService.createNotification(
                    saved.getOrganizerId(),
                    saved.getOrganizerEmail(),
                    saved.getOrganizerName(),
                    "❌ Meeting Cancelled: " + saved.getTitle(),
                    "Meeting with " + saved.getAttendeeName() + " was cancelled" + (reason != null ? " (Reason: " + reason + ")" : ""),
                    com.crm.appointment.model.NotificationType.MEETING_CANCELLED,
                    "HIGH",
                    saved.getId(),
                    null,
                    saved.getStartTime()
            );
        } catch (Exception e) {
            log.warn("Failed to generate cancellation notification: {}", e.getMessage());
        }

        return AppointmentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public com.crm.appointment.dto.IntegrationConfigResponse getIntegrationConfig(UserPrincipal principal) {
        com.crm.appointment.model.IntegrationConfig config = integrationConfigRepository.findByProviderKey("DEFAULT_INTEGRATION")
                .orElseGet(() -> integrationConfigRepository.save(com.crm.appointment.model.IntegrationConfig.builder()
                        .providerKey("DEFAULT_INTEGRATION")
                        .googleMeetEnabled(true)
                        .googleWorkspaceDomain("mycompany.com")
                        .zoomEnabled(true)
                        .zoomAccountId("act_zoom_enterprise")
                        .zoomClientId("client_zoom_prod")
                        .msTeamsEnabled(true)
                        .msTeamsTenantId("tenant_ms_teams")
                        .autoSyncCalendar(true)
                        .webhookUrl("https://api.mycompany.com/crm/webhooks/calendar")
                        .build()));
        return com.crm.appointment.dto.IntegrationConfigResponse.fromEntity(config);
    }

    @Transactional
    public com.crm.appointment.dto.IntegrationConfigResponse updateIntegrationConfig(
            com.crm.appointment.dto.IntegrationConfigRequest request,
            UserPrincipal principal
    ) {
        // Strict Matrix Rule: Only Admin can configure video conferencing & calendar integration APIs
        if (principal != null && !principal.isAdmin()) {
            throw new AccessDeniedException("Access Denied: Only Administrators can configure video conferencing and calendar integration APIs");
        }

        com.crm.appointment.model.IntegrationConfig config = integrationConfigRepository.findByProviderKey("DEFAULT_INTEGRATION")
                .orElseGet(() -> com.crm.appointment.model.IntegrationConfig.builder()
                        .providerKey("DEFAULT_INTEGRATION")
                        .build());

        config.setGoogleMeetEnabled(request.isGoogleMeetEnabled());
        if (request.getGoogleWorkspaceDomain() != null) config.setGoogleWorkspaceDomain(request.getGoogleWorkspaceDomain().trim());
        config.setZoomEnabled(request.isZoomEnabled());
        if (request.getZoomAccountId() != null) config.setZoomAccountId(request.getZoomAccountId().trim());
        if (request.getZoomClientId() != null) config.setZoomClientId(request.getZoomClientId().trim());
        config.setMsTeamsEnabled(request.isMsTeamsEnabled());
        if (request.getMsTeamsTenantId() != null) config.setMsTeamsTenantId(request.getMsTeamsTenantId().trim());
        config.setAutoSyncCalendar(request.isAutoSyncCalendar());
        if (request.getWebhookUrl() != null) config.setWebhookUrl(request.getWebhookUrl().trim());

        com.crm.appointment.model.IntegrationConfig saved = integrationConfigRepository.save(config);
        log.info("Updated Video Conferencing & Calendar Integration settings by Administrator {}", principal != null ? principal.getName() : "Admin");
        return com.crm.appointment.dto.IntegrationConfigResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteAppointment(Long id, UserPrincipal principal) {
        appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        // Strict Compliance Rule:
        // Only Admin can hard delete appointments.
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                throw new AccessDeniedException("Compliance policy: Hard-deletion of meeting records is restricted strictly to Administrators to preserve compliance trail");
            } else {
                throw new AccessDeniedException("Compliance policy: Sales Representatives cannot delete historical appointment records");
            }
        }

        appointmentRepository.deleteById(id);
        log.info("Permanently deleted Appointment ID: {} by Administrator {}", id, principal != null ? principal.getName() : "Admin");
    }

    @Transactional(readOnly = true)
    public AppointmentStatsResponse getStats(UserPrincipal principal) {
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        long totalAppointments;
        long scheduledUpcoming;
        long completedCount;
        long todayAppointments;
        long cancelledCount;
        long noShowCount;

        Map<String, Long> countByType = new HashMap<>();
        Map<String, Long> countByMode = new HashMap<>();
        Map<String, Long> countByStatus = new HashMap<>();

        if (principal == null || principal.isAdmin()) {
            // Global stats
            totalAppointments = appointmentRepository.count();
            scheduledUpcoming = appointmentRepository.countByStatus(AppointmentStatus.SCHEDULED) + appointmentRepository.countByStatus(AppointmentStatus.CONFIRMED);
            completedCount = appointmentRepository.countByStatus(AppointmentStatus.COMPLETED);
            cancelledCount = appointmentRepository.countByStatus(AppointmentStatus.CANCELLED);
            noShowCount = appointmentRepository.countByStatus(AppointmentStatus.NO_SHOW);
            todayAppointments = appointmentRepository.countBetweenDates(todayStart, todayEnd);

            for (Object[] row : appointmentRepository.countByMeetingType()) {
                if (row[0] != null && row[1] != null) countByType.put(row[0].toString(), ((Number) row[1]).longValue());
            }
            for (Object[] row : appointmentRepository.countByMeetingMode()) {
                if (row[0] != null && row[1] != null) countByMode.put(row[0].toString(), ((Number) row[1]).longValue());
            }
            for (Object[] row : appointmentRepository.countByStatusGroup()) {
                if (row[0] != null && row[1] != null) countByStatus.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        } else if (principal.isManager()) {
            // Team / department stats
            Long deptId = principal.getDepartmentId();
            Long userId = principal.getId();

            totalAppointments = appointmentRepository.countByDepartmentOrOrganizer(deptId, userId);
            scheduledUpcoming = appointmentRepository.countByDepartmentAndStatus(deptId, userId, AppointmentStatus.SCHEDULED)
                    + appointmentRepository.countByDepartmentAndStatus(deptId, userId, AppointmentStatus.CONFIRMED);
            completedCount = appointmentRepository.countByDepartmentAndStatus(deptId, userId, AppointmentStatus.COMPLETED);
            cancelledCount = appointmentRepository.countByDepartmentAndStatus(deptId, userId, AppointmentStatus.CANCELLED);
            noShowCount = appointmentRepository.countByDepartmentAndStatus(deptId, userId, AppointmentStatus.NO_SHOW);
            todayAppointments = appointmentRepository.countBetweenDatesForDepartment(todayStart, todayEnd, deptId, userId);

            for (Object[] row : appointmentRepository.countByMeetingTypeForDepartment(deptId, userId)) {
                if (row[0] != null && row[1] != null) countByType.put(row[0].toString(), ((Number) row[1]).longValue());
            }
            for (Object[] row : appointmentRepository.countByMeetingModeForDepartment(deptId, userId)) {
                if (row[0] != null && row[1] != null) countByMode.put(row[0].toString(), ((Number) row[1]).longValue());
            }
            for (Object[] row : appointmentRepository.countByStatusGroupForDepartment(deptId, userId)) {
                if (row[0] != null && row[1] != null) countByStatus.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        } else {
            // Personal user stats
            Long userId = principal.getId();

            totalAppointments = appointmentRepository.countByOrganizerId(userId);
            scheduledUpcoming = appointmentRepository.countByOrganizerIdAndStatus(userId, AppointmentStatus.SCHEDULED)
                    + appointmentRepository.countByOrganizerIdAndStatus(userId, AppointmentStatus.CONFIRMED);
            completedCount = appointmentRepository.countByOrganizerIdAndStatus(userId, AppointmentStatus.COMPLETED);
            cancelledCount = appointmentRepository.countByOrganizerIdAndStatus(userId, AppointmentStatus.CANCELLED);
            noShowCount = appointmentRepository.countByOrganizerIdAndStatus(userId, AppointmentStatus.NO_SHOW);
            todayAppointments = appointmentRepository.countBetweenDatesForUser(todayStart, todayEnd, userId);

            for (Object[] row : appointmentRepository.countByMeetingTypeForUser(userId)) {
                if (row[0] != null && row[1] != null) countByType.put(row[0].toString(), ((Number) row[1]).longValue());
            }
            for (Object[] row : appointmentRepository.countByMeetingModeForUser(userId)) {
                if (row[0] != null && row[1] != null) countByMode.put(row[0].toString(), ((Number) row[1]).longValue());
            }
            for (Object[] row : appointmentRepository.countByStatusGroupForUser(userId)) {
                if (row[0] != null && row[1] != null) countByStatus.put(row[0].toString(), ((Number) row[1]).longValue());
            }
        }

        long finishedTotal = completedCount + noShowCount;
        double showUpRate = finishedTotal > 0 ? ((double) completedCount / finishedTotal) * 100.0 : 100.0;

        return AppointmentStatsResponse.builder()
                .totalAppointments(totalAppointments)
                .scheduledUpcoming(scheduledUpcoming)
                .completedCount(completedCount)
                .todayAppointments(todayAppointments)
                .cancelledCount(cancelledCount)
                .noShowCount(noShowCount)
                .showUpRatePercent(Math.round(showUpRate * 10.0) / 10.0)
                .countByType(countByType)
                .countByMode(countByMode)
                .countByStatus(countByStatus)
                .build();
    }
}
