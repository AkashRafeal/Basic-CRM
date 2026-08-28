package com.crm.task.repository;

import com.crm.task.model.RelatedEntityType;
import com.crm.task.model.Task;
import com.crm.task.model.TaskPriority;
import com.crm.task.model.TaskStatus;
import com.crm.task.model.TaskType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("SELECT t FROM Task t WHERE " +
           "(t.isDeleted IS NULL OR t.isDeleted = false) AND " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           " LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(t.relatedEntityName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:status IS NULL OR t.status = :status) AND " +
           "(:priority IS NULL OR t.priority = :priority) AND " +
           "(:taskType IS NULL OR t.taskType = :taskType) AND " +
           "(:assignedId IS NULL OR t.assignedToUserId = :assignedId) AND " +
           "(:relatedType IS NULL OR t.relatedEntityType = :relatedType) " +
           "ORDER BY " +
           "CASE WHEN t.status = com.crm.task.model.TaskStatus.TODO THEN 1 WHEN t.status = com.crm.task.model.TaskStatus.IN_PROGRESS THEN 2 ELSE 3 END, " +
           "t.dueDate ASC NULLS LAST, t.createdAt DESC")
    List<Task> searchTasks(
            @Param("search") String search,
            @Param("status") TaskStatus status,
            @Param("priority") TaskPriority priority,
            @Param("taskType") TaskType taskType,
            @Param("assignedId") Long assignedId,
            @Param("relatedType") RelatedEntityType relatedType
    );

    @Query("SELECT t FROM Task t WHERE (t.isDeleted IS NULL OR t.isDeleted = false) AND t.assignedToUserId = :userId ORDER BY t.dueDate ASC NULLS LAST")
    List<Task> findByAssignedToUserIdOrderByDueDateAsc(@Param("userId") Long userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE (t.isDeleted IS NULL OR t.isDeleted = false) AND t.status = :status")
    long countByStatus(@Param("status") TaskStatus status);

    @Query("SELECT COUNT(t) FROM Task t WHERE (t.isDeleted IS NULL OR t.isDeleted = false) AND t.priority = :priority")
    long countByPriority(@Param("priority") TaskPriority priority);

    @Query("SELECT COUNT(t) FROM Task t WHERE (t.isDeleted IS NULL OR t.isDeleted = false) AND t.dueDate < :today AND t.status IN (com.crm.task.model.TaskStatus.TODO, com.crm.task.model.TaskStatus.IN_PROGRESS)")
    long countOverdueTasks(@Param("today") LocalDate today);

    @Query("SELECT COUNT(t) FROM Task t WHERE (t.isDeleted IS NULL OR t.isDeleted = false)")
    long countActiveTasks();

    @Query("SELECT t FROM Task t WHERE (t.isDeleted IS NULL OR t.isDeleted = false)")
    List<Task> findAllActiveTasks();
}
