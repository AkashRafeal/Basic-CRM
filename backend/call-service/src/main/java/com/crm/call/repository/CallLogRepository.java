package com.crm.call.repository;

import com.crm.call.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Long> {

    @Query("SELECT c FROM CallLog c WHERE " +
           "(:callType IS NULL OR c.callType = :callType) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:purpose IS NULL OR c.purpose = :purpose) AND " +
           "(:outcome IS NULL OR c.outcome = :outcome) AND " +
           "(:relatedToType IS NULL OR c.relatedToType = :relatedToType) AND " +
           "(:relatedToId IS NULL OR c.relatedToId = :relatedToId) AND " +
           "(:assignedToUserId IS NULL OR c.assignedToUserId = :assignedToUserId) AND " +
           "(CAST(:fromDate AS java.time.LocalDateTime) IS NULL OR c.scheduledStartTime >= :fromDate OR c.callStartTime >= :fromDate OR c.createdAt >= :fromDate) AND " +
           "(CAST(:toDate AS java.time.LocalDateTime) IS NULL OR c.scheduledStartTime <= :toDate OR c.callStartTime <= :toDate OR c.createdAt <= :toDate) AND " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(c.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.relatedToName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.contactName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.contactPhone) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.contactEmail) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.assignedToUserName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<CallLog> searchCalls(
            @Param("search") String search,
            @Param("callType") CallType callType,
            @Param("status") CallStatus status,
            @Param("purpose") CallPurpose purpose,
            @Param("outcome") CallOutcome outcome,
            @Param("relatedToType") RelatedEntityType relatedToType,
            @Param("relatedToId") Long relatedToId,
            @Param("assignedToUserId") Long assignedToUserId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    List<CallLog> findByRelatedToTypeAndRelatedToIdOrderByCreatedAtDesc(RelatedEntityType relatedToType, Long relatedToId);

    List<CallLog> findByStatusAndScheduledStartTimeBetweenOrderByScheduledStartTimeAsc(
            CallStatus status, LocalDateTime start, LocalDateTime end
    );

    long countByStatus(CallStatus status);

    long countByCallType(CallType callType);

    @Query("SELECT COUNT(c) FROM CallLog c WHERE c.scheduledStartTime BETWEEN :start AND :end")
    long countScheduledBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT COALESCE(SUM(c.durationMinutes), 0) FROM CallLog c WHERE c.status = 'COMPLETED'")
    long sumDurationMinutes();

    @Query("SELECT COALESCE(AVG(c.durationMinutes), 0.0) FROM CallLog c WHERE c.status = 'COMPLETED' AND c.durationMinutes IS NOT NULL")
    double avgDurationMinutes();

    @Query("SELECT c.purpose, COUNT(c) FROM CallLog c GROUP BY c.purpose")
    List<Object[]> countByPurposeGroup();

    @Query("SELECT c.outcome, COUNT(c) FROM CallLog c WHERE c.outcome IS NOT NULL GROUP BY c.outcome")
    List<Object[]> countByOutcomeGroup();

    @Query("SELECT c.status, COUNT(c) FROM CallLog c GROUP BY c.status")
    List<Object[]> countByStatusGroup();

    @Query("SELECT c.callType, COUNT(c) FROM CallLog c GROUP BY c.callType")
    List<Object[]> countByTypeGroup();
}
