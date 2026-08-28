package com.crm.activity.service;

import com.crm.activity.dto.ActivityResponse;
import com.crm.activity.dto.ActivityStatsResponse;
import com.crm.activity.dto.CreateActivityRequest;
import com.crm.activity.model.ActivityLog;
import com.crm.activity.model.ActivityType;
import com.crm.activity.model.EntityType;
import com.crm.activity.repository.ActivityLogRepository;
import com.crm.activity.repository.NoteRepository;
import com.crm.activity.security.UserPrincipal;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final NoteRepository noteRepository;

    @Transactional
    public ActivityResponse createActivity(CreateActivityRequest request, UserPrincipal principal) {
        Long actorId = principal != null && principal.getId() != null ? principal.getId() : 1L;
        String actorName = principal != null && principal.getName() != null ? principal.getName() : "System User";
        String actorRole = principal != null && principal.getRole() != null ? principal.getRole() : "ROLE_ADMIN";
        Long actorDeptId = principal != null ? principal.getDepartmentId() : null;

        ActivityLog act = ActivityLog.builder()
                .activityType(request.getActivityType())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .entityTitle(request.getEntityTitle())
                .metadataJson(request.getMetadataJson())
                .actorId(actorId)
                .actorName(actorName)
                .actorRole(actorRole)
                .actorDepartmentId(actorDeptId)
                .build();

        ActivityLog saved = activityLogRepository.save(act);
        log.info("Recorded Activity Log ID: {} [{}] by {} (Dept: {})", saved.getId(), saved.getActivityType(), saved.getActorName(), saved.getActorDepartmentId());
        return ActivityResponse.fromEntity(saved);
    }

    @Transactional
    public void logInternalActivity(
            ActivityType type,
            String title,
            String description,
            EntityType entityType,
            Long entityId,
            String entityTitle,
            UserPrincipal principal
    ) {
        Long actorId = principal != null && principal.getId() != null ? principal.getId() : 1L;
        String actorName = principal != null && principal.getName() != null ? principal.getName() : "System User";
        String actorRole = principal != null && principal.getRole() != null ? principal.getRole() : "ROLE_ADMIN";
        Long actorDeptId = principal != null ? principal.getDepartmentId() : null;

        ActivityLog act = ActivityLog.builder()
                .activityType(type)
                .title(title)
                .description(description)
                .entityType(entityType)
                .entityId(entityId)
                .entityTitle(entityTitle)
                .actorId(actorId)
                .actorName(actorName)
                .actorRole(actorRole)
                .actorDepartmentId(actorDeptId)
                .build();

        activityLogRepository.save(act);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getActivities(
            EntityType entityType,
            Long entityId,
            ActivityType activityType,
            Long actorId,
            String search,
            int page,
            int size,
            UserPrincipal principal
    ) {
        Specification<ActivityLog> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (entityType != null) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            if (activityType != null) {
                predicates.add(cb.equal(root.get("activityType"), activityType));
            }
            if (actorId != null) {
                predicates.add(cb.equal(root.get("actorId"), actorId));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), term);
                Predicate actorMatch = cb.like(cb.lower(root.get("actorName")), term);
                Predicate entityTitleMatch = cb.like(cb.lower(root.get("entityTitle")), term);
                predicates.add(cb.or(titleMatch, descMatch, actorMatch, entityTitleMatch));
            }

            // Role-Based Timeline Scoping:
            // Admin: Organization-wide audit trail
            // Manager: Team activity timeline (matching departmentId or self)
            // Employee: Own account activity history
            if (principal != null && !principal.isAdmin()) {
                if (principal.isManager()) {
                    if (principal.getDepartmentId() != null) {
                        Predicate deptMatch = cb.equal(root.get("actorDepartmentId"), principal.getDepartmentId());
                        Predicate selfMatch = cb.equal(root.get("actorId"), principal.getId());
                        predicates.add(cb.or(deptMatch, selfMatch));
                    } else {
                        predicates.add(cb.equal(root.get("actorId"), principal.getId()));
                    }
                } else {
                    predicates.add(cb.equal(root.get("actorId"), principal.getId()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return activityLogRepository.findAll(spec, pageable).map(ActivityResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> getEntityTimeline(EntityType entityType, Long entityId) {
        return activityLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId)
                .stream()
                .map(ActivityResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ActivityStatsResponse getStats(UserPrincipal principal) {
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);

        long totalActivities;
        long totalNotes;
        long pinnedNotes;
        long todayActivities;
        Map<String, Long> activitiesByType = new HashMap<>();
        Map<String, Long> notesByEntity = new HashMap<>();

        if (principal == null || principal.isAdmin()) {
            // Global company metrics
            totalActivities = activityLogRepository.count();
            totalNotes = noteRepository.count();
            pinnedNotes = noteRepository.countByIsPinnedTrue();
            todayActivities = activityLogRepository.countActivitiesSince(todayStart);

            List<Object[]> typeCounts = activityLogRepository.countActivitiesByType();
            for (Object[] row : typeCounts) {
                if (row[0] != null && row[1] != null) {
                    activitiesByType.put(row[0].toString(), ((Number) row[1]).longValue());
                }
            }

            List<Object[]> entityCounts = noteRepository.countNotesByEntityType();
            for (Object[] row : entityCounts) {
                if (row[0] != null && row[1] != null) {
                    notesByEntity.put(row[0].toString(), ((Number) row[1]).longValue());
                }
            }
        } else if (principal.isManager()) {
            // Team metrics
            Long deptId = principal.getDepartmentId();
            Long userId = principal.getId();

            totalActivities = activityLogRepository.countByDepartmentOrActor(deptId, userId);
            totalNotes = noteRepository.countByDepartmentOrAuthor(deptId, userId);
            pinnedNotes = noteRepository.countPinnedByDepartmentOrAuthor(deptId, userId);
            todayActivities = activityLogRepository.countActivitiesSinceForDepartment(todayStart, deptId, userId);

            List<Object[]> typeCounts = activityLogRepository.countActivitiesByTypeForDepartment(deptId, userId);
            for (Object[] row : typeCounts) {
                if (row[0] != null && row[1] != null) {
                    activitiesByType.put(row[0].toString(), ((Number) row[1]).longValue());
                }
            }

            List<Object[]> entityCounts = noteRepository.countNotesByEntityTypeForDepartment(deptId, userId);
            for (Object[] row : entityCounts) {
                if (row[0] != null && row[1] != null) {
                    notesByEntity.put(row[0].toString(), ((Number) row[1]).longValue());
                }
            }
        } else {
            // Personal metrics
            Long userId = principal.getId();

            totalActivities = activityLogRepository.countByActorId(userId);
            totalNotes = noteRepository.countByAuthorId(userId);
            pinnedNotes = noteRepository.countByAuthorIdAndIsPinnedTrue(userId);
            todayActivities = activityLogRepository.countActivitiesSinceForUser(todayStart, userId);

            List<Object[]> typeCounts = activityLogRepository.countActivitiesByTypeForUser(userId);
            for (Object[] row : typeCounts) {
                if (row[0] != null && row[1] != null) {
                    activitiesByType.put(row[0].toString(), ((Number) row[1]).longValue());
                }
            }

            List<Object[]> entityCounts = noteRepository.countNotesByEntityTypeForUser(userId);
            for (Object[] row : entityCounts) {
                if (row[0] != null && row[1] != null) {
                    notesByEntity.put(row[0].toString(), ((Number) row[1]).longValue());
                }
            }
        }

        return ActivityStatsResponse.builder()
                .totalActivities(totalActivities)
                .totalNotes(totalNotes)
                .pinnedNotes(pinnedNotes)
                .todayActivities(todayActivities)
                .activitiesByType(activitiesByType)
                .notesByEntity(notesByEntity)
                .build();
    }
}
