package com.crm.followup.repository;

import com.crm.followup.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FollowUpRepository extends JpaRepository<FollowUp, Long> {

    @Query("SELECT f FROM FollowUp f WHERE " +
           "(f.isDeleted IS NULL OR f.isDeleted = false) AND " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           " LOWER(f.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(f.notes) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(f.targetName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:status IS NULL OR f.status = :status) AND " +
           "(:channel IS NULL OR f.channel = :channel) AND " +
           "(:outcome IS NULL OR f.outcome = :outcome) AND " +
           "(:priority IS NULL OR f.priority = :priority) AND " +
           "(:assignedId IS NULL OR f.assignedToUserId = :assignedId) AND " +
           "(:targetType IS NULL OR f.targetType = :targetType) AND " +
           "(:isGlobal = true OR (f.assignedToUserId IN :assignedUserIds) OR (:includeUnassigned = true AND f.assignedToUserId IS NULL)) " +
           "ORDER BY f.scheduledAt ASC, f.createdAt DESC")
    List<FollowUp> searchFollowUps(
            @Param("search") String search,
            @Param("status") FollowUpStatus status,
            @Param("channel") FollowUpChannel channel,
            @Param("outcome") FollowUpOutcome outcome,
            @Param("priority") FollowUpPriority priority,
            @Param("assignedId") Long assignedId,
            @Param("targetType") TargetType targetType,
            @Param("isGlobal") boolean isGlobal,
            @Param("assignedUserIds") List<Long> assignedUserIds,
            @Param("includeUnassigned") boolean includeUnassigned
    );

    @Query("SELECT f FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false) AND f.assignedToUserId = :userId AND f.scheduledAt BETWEEN :start AND :end ORDER BY f.scheduledAt ASC")
    List<FollowUp> findByAssignedToUserIdAndScheduledAtBetweenOrderByScheduledAtAsc(
            @Param("userId") Long userId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("SELECT f FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false) AND f.assignedToUserId = :userId ORDER BY f.scheduledAt ASC")
    List<FollowUp> findByAssignedToUserIdOrderByScheduledAtAsc(@Param("userId") Long userId);

    @Query("SELECT f FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false) AND f.assignedToUserId IS NULL ORDER BY f.scheduledAt ASC")
    List<FollowUp> findUnassigned();

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false) AND f.status = :status")
    long countByStatus(@Param("status") FollowUpStatus status);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false) AND f.outcome = :outcome")
    long countByOutcome(@Param("outcome") FollowUpOutcome outcome);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false) AND f.scheduledAt BETWEEN :startOfDay AND :endOfDay")
    long countScheduledToday(@Param("startOfDay") LocalDateTime startOfDay, @Param("endOfDay") LocalDateTime endOfDay);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false) AND f.scheduledAt < :now AND f.status = com.crm.followup.model.FollowUpStatus.SCHEDULED")
    long countMissedFollowUps(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(f) FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false)")
    long countActiveFollowUps();

    @Query("SELECT f FROM FollowUp f WHERE (f.isDeleted IS NULL OR f.isDeleted = false)")
    List<FollowUp> findAllActiveFollowUps();
}
