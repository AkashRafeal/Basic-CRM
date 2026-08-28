package com.crm.followup.service;

import com.crm.followup.common.ResourceNotFoundException;
import com.crm.followup.dto.*;
import com.crm.followup.model.*;
import com.crm.followup.repository.FollowUpCadenceConfigRepository;
import com.crm.followup.repository.FollowUpRepository;
import com.crm.followup.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final FollowUpCadenceConfigRepository cadenceConfigRepository;
    private final JdbcTemplate jdbcTemplate;

    public static class UserScope {
        public final boolean isAdmin;
        public final boolean isManager;
        public final boolean isEmployee;
        public final Long currentUserId;
        public final List<Long> accessibleUserIds;

        public UserScope(boolean isAdmin, boolean isManager, boolean isEmployee, Long currentUserId, List<Long> accessibleUserIds) {
            this.isAdmin = isAdmin;
            this.isManager = isManager;
            this.isEmployee = isEmployee;
            this.currentUserId = currentUserId;
            this.accessibleUserIds = accessibleUserIds != null ? accessibleUserIds : Collections.emptyList();
        }

        public String getSqlInClause() {
            if (isAdmin || accessibleUserIds.isEmpty()) return "";
            return accessibleUserIds.stream().map(String::valueOf).collect(Collectors.joining(","));
        }
    }

    public UserScope resolveScope(UserPrincipal user) {
        if (user == null) {
            return new UserScope(true, false, false, null, Collections.emptyList());
        }

        String role = user.getRole() != null ? user.getRole().replace("ROLE_", "").toUpperCase() : "EMPLOYEE";
        Long userId = user.getId();

        if ("ADMIN".equals(role)) {
            return new UserScope(true, false, false, userId, Collections.emptyList());
        } else if ("MANAGER".equals(role)) {
            List<Long> teamIds = new ArrayList<>();
            if (userId != null) {
                teamIds.add(userId);
                List<Long> memberIds = jdbcTemplate.query(
                        "SELECT id FROM crm_users WHERE manager_id = ? OR (department_id = (SELECT department_id FROM crm_users WHERE id = ?) AND department_id IS NOT NULL)",
                        (rs, rowNum) -> rs.getLong("id"),
                        userId, userId
                );
                teamIds.addAll(memberIds);
            }
            List<Long> distinctTeamIds = teamIds.stream().distinct().collect(Collectors.toList());
            return new UserScope(false, true, false, userId, distinctTeamIds);
        } else {
            List<Long> singleId = userId != null ? List.of(userId) : Collections.emptyList();
            return new UserScope(false, false, true, userId, singleId);
        }
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> searchFollowUps(
            String search,
            FollowUpStatus status,
            FollowUpChannel channel,
            FollowUpOutcome outcome,
            FollowUpPriority priority,
            Long assignedId,
            TargetType targetType,
            UserPrincipal principal
    ) {
        UserScope scope = resolveScope(principal);
        if (scope.isEmployee) {
            throw new AccessDeniedException("Organization-wide follow-up view is restricted. Please use your personal schedule and unassigned pool.");
        }

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return followUpRepository.searchFollowUps(
                cleanSearch, status, channel, outcome, priority, assignedId, targetType,
                scope.isAdmin, scope.accessibleUserIds, scope.isManager
        ).stream()
         .map(FollowUpResponse::fromEntity)
         .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getMySchedule(Long userId) {
        return followUpRepository.findByAssignedToUserIdOrderByScheduledAtAsc(userId)
                .stream()
                .map(FollowUpResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FollowUpResponse> getUnassignedFollowUps() {
        return followUpRepository.findUnassigned()
                .stream()
                .map(FollowUpResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public FollowUpResponse claimFollowUp(Long id, UserPrincipal principal) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));

        followUp.setAssignedToUserId(principal.getId());
        followUp.setAssignedToUserName(principal.getName());

        FollowUp saved = followUpRepository.save(followUp);
        log.info("User {} (id: {}) claimed unassigned follow-up id {}", principal.getName(), principal.getId(), id);
        return FollowUpResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public FollowUpResponse getFollowUpById(Long id) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));
        return FollowUpResponse.fromEntity(followUp);
    }

    @Transactional
    public FollowUpResponse createFollowUp(CreateFollowUpRequest request, UserPrincipal currentUser) {
        UserScope scope = resolveScope(currentUser);

        Long assignedToUserId = request.getAssignedToUserId();
        String assignedToUserName = request.getAssignedToUserName();

        if (scope.isEmployee) {
            // Employee automatically schedules for self
            assignedToUserId = scope.currentUserId;
            assignedToUserName = currentUser != null ? currentUser.getName() : "Sales Representative";
        }

        Long creatorId = currentUser != null ? currentUser.getId() : null;
        String creatorName = currentUser != null ? currentUser.getName() : null;
        String creatorRole = currentUser != null ? currentUser.getRole() : "ROLE_ADMIN";

        FollowUp followUp = FollowUp.builder()
                .title(request.getTitle())
                .channel(request.getChannel() != null ? request.getChannel() : FollowUpChannel.PHONE_CALL)
                .scheduledAt(request.getScheduledAt())
                .status(FollowUpStatus.SCHEDULED)
                .outcome(FollowUpOutcome.PENDING)
                .priority(request.getPriority() != null ? request.getPriority() : FollowUpPriority.MEDIUM)
                .notes(request.getNotes())
                .assignedToUserId(assignedToUserId)
                .assignedToUserName(assignedToUserName)
                .targetType(request.getTargetType() != null ? request.getTargetType() : TargetType.LEAD)
                .targetId(request.getTargetId())
                .targetName(request.getTargetName())
                .productId(request.getProductId())
                .productName(request.getProductName())
                .createdByUserId(creatorId)
                .createdByUserName(creatorName)
                .createdByRole(creatorRole)
                .isDeleted(false)
                .build();

        FollowUp saved = followUpRepository.save(followUp);
        log.info("Created new follow-up '{}' (id: {}) by user {} ({})", saved.getTitle(), saved.getId(), creatorName, creatorRole);
        return FollowUpResponse.fromEntity(saved);
    }

    @Transactional
    public FollowUpResponse updateFollowUp(Long id, UpdateFollowUpRequest request) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) followUp.setTitle(request.getTitle());
        if (request.getChannel() != null) followUp.setChannel(request.getChannel());
        if (request.getScheduledAt() != null) followUp.setScheduledAt(request.getScheduledAt());
        if (request.getStatus() != null) followUp.setStatus(request.getStatus());
        if (request.getOutcome() != null) followUp.setOutcome(request.getOutcome());
        if (request.getPriority() != null) followUp.setPriority(request.getPriority());
        if (request.getNotes() != null) followUp.setNotes(request.getNotes());
        if (request.getNextFollowUpDate() != null) followUp.setNextFollowUpDate(request.getNextFollowUpDate());
        if (request.getAssignedToUserId() != null) followUp.setAssignedToUserId(request.getAssignedToUserId());
        if (request.getAssignedToUserName() != null) followUp.setAssignedToUserName(request.getAssignedToUserName());
        if (request.getTargetType() != null) followUp.setTargetType(request.getTargetType());
        if (request.getTargetId() != null) followUp.setTargetId(request.getTargetId());
        if (request.getTargetName() != null) followUp.setTargetName(request.getTargetName());
        if (request.getProductId() != null) followUp.setProductId(request.getProductId());
        if (request.getProductName() != null) followUp.setProductName(request.getProductName());

        FollowUp saved = followUpRepository.save(followUp);
        log.info("Updated follow-up '{}' (id: {})", saved.getTitle(), saved.getId());
        return FollowUpResponse.fromEntity(saved);
    }

    @Transactional
    public FollowUpResponse completeFollowUp(Long id, CompleteFollowUpRequest request, UserPrincipal principal) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));

        UserScope scope = resolveScope(principal);

        // Employee can only complete own assigned touchpoints
        if (scope.isEmployee) {
            if (followUp.getAssignedToUserId() == null || !followUp.getAssignedToUserId().equals(scope.currentUserId)) {
                throw new AccessDeniedException("Sales representatives can only record interaction outcomes for their own assigned touchpoints.");
            }
        }

        // Manager can complete team touchpoints or unassigned
        if (scope.isManager) {
            if (followUp.getAssignedToUserId() != null && !scope.accessibleUserIds.contains(followUp.getAssignedToUserId())) {
                throw new AccessDeniedException("Managers can only record interaction outcomes for their direct team touchpoints.");
            }
        }

        followUp.setStatus(FollowUpStatus.COMPLETED);
        followUp.setOutcome(request.getOutcome());
        followUp.setCompletedAt(LocalDateTime.now());
        if (request.getNotes() != null && !request.getNotes().trim().isEmpty()) {
            String updatedNotes = (followUp.getNotes() != null ? followUp.getNotes() + "\n\n[Outcome Log]: " : "[Outcome Log]: ") + request.getNotes();
            followUp.setNotes(updatedNotes);
        }
        followUp.setNextFollowUpDate(request.getNextFollowUpDate());

        FollowUp saved = followUpRepository.save(followUp);
        log.info("Completed follow-up id {} with outcome {} by user {}", id, request.getOutcome(), principal.getName());

        // Automatically schedule next follow-up if date is provided
        if (request.getNextFollowUpDate() != null) {
            FollowUp nextFollowUp = FollowUp.builder()
                    .title("Follow-up cadence: " + followUp.getTargetName())
                    .channel(followUp.getChannel())
                    .scheduledAt(request.getNextFollowUpDate())
                    .status(FollowUpStatus.SCHEDULED)
                    .outcome(FollowUpOutcome.PENDING)
                    .priority(followUp.getPriority())
                    .notes("Generated from prior interaction: " + request.getOutcome().getDisplayName())
                    .assignedToUserId(followUp.getAssignedToUserId())
                    .assignedToUserName(followUp.getAssignedToUserName())
                    .targetType(followUp.getTargetType())
                    .targetId(followUp.getTargetId())
                    .targetName(followUp.getTargetName())
                    .build();

            followUpRepository.save(nextFollowUp);
            log.info("Auto-scheduled next follow-up for target '{}' on {}", followUp.getTargetName(), request.getNextFollowUpDate());
        }

        return FollowUpResponse.fromEntity(saved);
    }

    @Transactional
    public FollowUpResponse rescheduleFollowUp(Long id, RescheduleFollowUpRequest request) {
        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));

        followUp.setScheduledAt(request.getScheduledAt());
        followUp.setStatus(FollowUpStatus.RESCHEDULED);
        if (request.getNotes() != null) {
            followUp.setNotes((followUp.getNotes() != null ? followUp.getNotes() + "\n" : "") + "[Rescheduled]: " + request.getNotes());
        }

        FollowUp saved = followUpRepository.save(followUp);
        log.info("Rescheduled follow-up id {} to {}", id, request.getScheduledAt());
        return FollowUpResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteFollowUp(Long id, UserPrincipal currentUser, Boolean permanent) {
        UserScope scope = resolveScope(currentUser);
        if (!scope.isAdmin) {
            throw new AccessDeniedException("Deleting follow-up records is restricted to Administrators to preserve customer interaction history and audit trails.");
        }

        FollowUp followUp = followUpRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Follow-up not found with id: " + id));

        if (Boolean.TRUE.equals(permanent)) {
            followUpRepository.delete(followUp);
            log.info("Administrator {} permanently deleted follow-up id {}", currentUser.getName(), id);
        } else {
            followUp.setIsDeleted(true);
            followUp.setDeletedAt(LocalDateTime.now());
            followUpRepository.save(followUp);
            log.info("Administrator {} soft-deleted follow-up id {}", currentUser.getName(), id);
        }
    }

    @Transactional(readOnly = true)
    public FollowUpStatsResponse getFollowUpStats(UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        String inClause = scope.getSqlInClause();

        String whereClause = " WHERE (is_deleted IS NULL OR is_deleted = false)";
        if (scope.isManager) {
            whereClause += " AND (assigned_to_user_id IN (" + inClause + ") OR assigned_to_user_id IS NULL)";
        } else if (scope.isEmployee) {
            whereClause += " AND assigned_to_user_id = " + scope.currentUserId;
        }

        long totalFollowUps = queryForLong("SELECT COUNT(*) FROM crm_followups" + whereClause);
        long scheduledToday = queryForLong("SELECT COUNT(*) FROM crm_followups" + whereClause + " AND DATE(scheduled_at) = CURRENT_DATE");
        long totalScheduled = queryForLong("SELECT COUNT(*) FROM crm_followups" + whereClause + " AND status = 'SCHEDULED'");
        long totalCompleted = queryForLong("SELECT COUNT(*) FROM crm_followups" + whereClause + " AND status = 'COMPLETED'");
        long totalMissed = queryForLong("SELECT COUNT(*) FROM crm_followups" + whereClause + " AND status = 'SCHEDULED' AND scheduled_at < NOW()");

        long positiveOutcomes = queryForLong("SELECT COUNT(*) FROM crm_followups" + whereClause +
                " AND outcome IN ('INTERESTED', 'PROPOSAL_REQUESTED', 'MEETING_BOOKED', 'DEAL_WON')");

        double successRate = 0.0;
        if (totalCompleted > 0) {
            successRate = Math.round(((double) positiveOutcomes / totalCompleted) * 1000.0) / 10.0;
        }

        Map<String, Long> byChannel = new LinkedHashMap<>();
        for (FollowUpChannel ch : FollowUpChannel.values()) {
            byChannel.put(ch.name(), 0L);
        }
        List<Map<String, Object>> chRows = jdbcTemplate.queryForList(
                "SELECT channel, COUNT(*) as cnt FROM crm_followups" + whereClause + " GROUP BY channel"
        );
        for (Map<String, Object> r : chRows) {
            if (r.get("channel") != null) {
                byChannel.put(String.valueOf(r.get("channel")), ((Number) r.get("cnt")).longValue());
            }
        }

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (FollowUpStatus st : FollowUpStatus.values()) {
            byStatus.put(st.name(), 0L);
        }
        List<Map<String, Object>> stRows = jdbcTemplate.queryForList(
                "SELECT status, COUNT(*) as cnt FROM crm_followups" + whereClause + " GROUP BY status"
        );
        for (Map<String, Object> r : stRows) {
            if (r.get("status") != null) {
                byStatus.put(String.valueOf(r.get("status")), ((Number) r.get("cnt")).longValue());
            }
        }

        Map<String, Long> byOutcome = new LinkedHashMap<>();
        for (FollowUpOutcome oc : FollowUpOutcome.values()) {
            byOutcome.put(oc.name(), 0L);
        }
        List<Map<String, Object>> ocRows = jdbcTemplate.queryForList(
                "SELECT outcome, COUNT(*) as cnt FROM crm_followups" + whereClause + " GROUP BY outcome"
        );
        for (Map<String, Object> r : ocRows) {
            if (r.get("outcome") != null) {
                byOutcome.put(String.valueOf(r.get("outcome")), ((Number) r.get("cnt")).longValue());
            }
        }

        return FollowUpStatsResponse.builder()
                .totalFollowUps(totalFollowUps)
                .scheduledToday(scheduledToday)
                .totalScheduled(totalScheduled)
                .totalCompleted(totalCompleted)
                .totalMissed(totalMissed)
                .positiveOutcomes(positiveOutcomes)
                .successRate(successRate)
                .followUpsByChannel(byChannel)
                .followUpsByStatus(byStatus)
                .followUpsByOutcome(byOutcome)
                .build();
    }

    @Transactional
    public CadenceConfigDTO getCadenceConfigs() {
        FollowUpCadenceConfig config = cadenceConfigRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> cadenceConfigRepository.save(FollowUpCadenceConfig.builder().build()));
        return CadenceConfigDTO.fromEntity(config);
    }

    @Transactional
    public CadenceConfigDTO updateCadenceConfigs(UpdateCadenceConfigRequest request, UserPrincipal principal) {
        UserScope scope = resolveScope(principal);
        if (!scope.isAdmin) {
            throw new AccessDeniedException("Configuring follow-up cadence rules is restricted to Administrators.");
        }

        FollowUpCadenceConfig config = cadenceConfigRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> FollowUpCadenceConfig.builder().build());

        if (request.getCadenceName() != null) config.setCadenceName(request.getCadenceName());
        if (request.getInitialTouchpointHours() != null) config.setInitialTouchpointHours(request.getInitialTouchpointHours());
        if (request.getSecondTouchpointDays() != null) config.setSecondTouchpointDays(request.getSecondTouchpointDays());
        if (request.getThirdTouchpointDays() != null) config.setThirdTouchpointDays(request.getThirdTouchpointDays());
        if (request.getMaxAttemptsBeforeDormant() != null) config.setMaxAttemptsBeforeDormant(request.getMaxAttemptsBeforeDormant());
        if (request.getAutoEscalateOverdueHours() != null) config.setAutoEscalateOverdueHours(request.getAutoEscalateOverdueHours());
        if (request.getEnableSmsReminders() != null) config.setEnableSmsReminders(request.getEnableSmsReminders());
        if (request.getEnableEmailCadence() != null) config.setEnableEmailCadence(request.getEnableEmailCadence());

        FollowUpCadenceConfig saved = cadenceConfigRepository.save(config);
        log.info("Admin updated follow-up cadence configurations");
        return CadenceConfigDTO.fromEntity(saved);
    }

    private long queryForLong(String sql) {
        Long val = jdbcTemplate.queryForObject(sql, Long.class);
        return val != null ? val : 0L;
    }
}
