package com.crm.pipeline.repository;

import com.crm.pipeline.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface DealRepository extends JpaRepository<Deal, Long> {

    @Query("SELECT d FROM Deal d WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           " LOWER(d.dealName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(d.customerName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(d.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:stage IS NULL OR d.stage = :stage) AND " +
           "(:dealType IS NULL OR d.dealType = :dealType) AND " +
           "(:priority IS NULL OR d.priority = :priority) AND " +
           "(:assignedId IS NULL OR d.assignedToUserId = :assignedId) " +
           "ORDER BY d.expectedCloseDate ASC NULLS LAST, d.amount DESC")
    List<Deal> searchDeals(
            @Param("search") String search,
            @Param("stage") DealStage stage,
            @Param("dealType") DealType dealType,
            @Param("priority") DealPriority priority,
            @Param("assignedId") Long assignedId
    );

    List<Deal> findByStage(DealStage stage);

    List<Deal> findByAssignedToUserId(Long userId);

    long countByStage(DealStage stage);

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Deal d WHERE d.stage != com.crm.pipeline.model.DealStage.CLOSED_LOST")
    BigDecimal sumTotalPipelineValue();

    @Query("SELECT COALESCE(SUM(d.expectedRevenue), 0) FROM Deal d WHERE d.stage != com.crm.pipeline.model.DealStage.CLOSED_LOST")
    BigDecimal sumWeightedPipelineRevenue();

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Deal d WHERE d.stage = com.crm.pipeline.model.DealStage.CLOSED_WON")
    BigDecimal sumClosedWonRevenue();

    @Query("SELECT COALESCE(SUM(d.amount), 0) FROM Deal d WHERE d.stage = :stage")
    BigDecimal sumValueByStage(@Param("stage") DealStage stage);

    @Query("SELECT COALESCE(SUM(d.expectedRevenue), 0) FROM Deal d WHERE d.stage = :stage")
    BigDecimal sumExpectedRevenueByStage(@Param("stage") DealStage stage);
}
