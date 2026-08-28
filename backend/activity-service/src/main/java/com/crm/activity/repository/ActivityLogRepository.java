package com.crm.activity.repository;

import com.crm.activity.model.ActivityLog;
import com.crm.activity.model.EntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long>, JpaSpecificationExecutor<ActivityLog> {

    List<ActivityLog> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(EntityType entityType, Long entityId);

    Page<ActivityLog> findByOrderByCreatedAtDesc(Pageable pageable);

    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.createdAt >= :since")
    long countActivitiesSince(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE (a.actorDepartmentId = :deptId OR a.actorId = :userId) AND a.createdAt >= :since")
    long countActivitiesSinceForDepartment(@Param("since") LocalDateTime since, @Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.actorId = :userId AND a.createdAt >= :since")
    long countActivitiesSinceForUser(@Param("since") LocalDateTime since, @Param("userId") Long userId);

    @Query("SELECT COUNT(a) FROM ActivityLog a WHERE a.actorDepartmentId = :deptId OR a.actorId = :userId")
    long countByDepartmentOrActor(@Param("deptId") Long deptId, @Param("userId") Long userId);

    long countByActorId(Long actorId);

    @Query("SELECT a.activityType, COUNT(a) FROM ActivityLog a GROUP BY a.activityType")
    List<Object[]> countActivitiesByType();

    @Query("SELECT a.activityType, COUNT(a) FROM ActivityLog a WHERE a.actorDepartmentId = :deptId OR a.actorId = :userId GROUP BY a.activityType")
    List<Object[]> countActivitiesByTypeForDepartment(@Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT a.activityType, COUNT(a) FROM ActivityLog a WHERE a.actorId = :userId GROUP BY a.activityType")
    List<Object[]> countActivitiesByTypeForUser(@Param("userId") Long userId);
}
