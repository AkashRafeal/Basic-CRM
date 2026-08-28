package com.crm.communication.repository;

import com.crm.communication.model.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommunicationLogRepository extends JpaRepository<CommunicationLog, Long> {

    @Query("SELECT c FROM CommunicationLog c WHERE " +
           "(:query IS NULL OR :query = '' OR " +
           " LOWER(c.subject) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.recipientName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.recipientAddress) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.senderName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.senderAddress) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.relatedToName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           " LOWER(c.body) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "(:channel IS NULL OR c.channel = :channel) AND " +
           "(:direction IS NULL OR c.direction = :direction) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:relatedToType IS NULL OR c.relatedToType = :relatedToType) AND " +
           "(:isStarred IS NULL OR c.isStarred = :isStarred) AND " +
           "(:isRead IS NULL OR c.isRead = :isRead) AND " +
           "(:isGlobal = true OR (c.assignedToUserId IN :assignedUserIds) OR (:includeUnassigned = true AND c.assignedToUserId IS NULL))")
    Page<CommunicationLog> searchCommunications(
            @Param("query") String query,
            @Param("channel") CommunicationChannel channel,
            @Param("direction") CommunicationDirection direction,
            @Param("status") MessageStatus status,
            @Param("relatedToType") RelatedEntityType relatedToType,
            @Param("isStarred") Boolean isStarred,
            @Param("isRead") Boolean isRead,
            @Param("isGlobal") boolean isGlobal,
            @Param("assignedUserIds") List<Long> assignedUserIds,
            @Param("includeUnassigned") boolean includeUnassigned,
            Pageable pageable
    );

    List<CommunicationLog> findByThreadIdOrderByCreatedAtAsc(String threadId);

    List<CommunicationLog> findByRelatedToTypeAndRelatedToIdOrderByCreatedAtDesc(RelatedEntityType relatedToType, Long relatedToId);
}
