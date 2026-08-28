package com.crm.lead.repository;

import com.crm.lead.model.Lead;
import com.crm.lead.model.LeadSource;
import com.crm.lead.model.LeadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    List<Lead> findByLeadStatus(LeadStatus status);

    List<Lead> findByAssignedToUserId(Long userId);

    @Query(
        "SELECT l FROM Lead l WHERE " +
        "(:status IS NULL OR l.leadStatus = :status) AND " +
        "(:source IS NULL OR l.leadSource = :source) AND " +
        "(:assignedUserId IS NULL OR l.assignedToUserId = :assignedUserId) AND " +
        "(CAST(:search AS string) IS NULL OR :search = '' OR " +
        " LOWER(l.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
        " LOWER(l.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
        " LOWER(l.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
        " LOWER(l.company) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))" +
        " ORDER BY l.createdAt DESC"
    )
    List<Lead> searchLeads(
        @Param("search") String search,
        @Param("status") LeadStatus status,
        @Param("source") LeadSource source,
        @Param("assignedUserId") Long assignedUserId
    );

    @Query("SELECT COALESCE(SUM(l.estimatedValue), 0) FROM Lead l WHERE l.leadStatus != 'LOST'")
    BigDecimal calculateTotalPipelineValue();

    long countByLeadStatus(LeadStatus status);
}
