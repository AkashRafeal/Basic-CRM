package com.crm.activity.repository;

import com.crm.activity.model.EntityType;
import com.crm.activity.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NoteRepository extends JpaRepository<Note, Long>, JpaSpecificationExecutor<Note> {

    List<Note> findByEntityTypeAndEntityIdOrderByIsPinnedDescCreatedAtDesc(EntityType entityType, Long entityId);

    List<Note> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    long countByIsPinnedTrue();

    long countByAuthorId(Long authorId);

    long countByAuthorIdAndIsPinnedTrue(Long authorId);

    @Query("SELECT COUNT(n) FROM Note n WHERE n.authorDepartmentId = :deptId OR n.authorId = :userId")
    long countByDepartmentOrAuthor(@Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Note n WHERE (n.authorDepartmentId = :deptId OR n.authorId = :userId) AND n.isPinned = true")
    long countPinnedByDepartmentOrAuthor(@Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT n.entityType, COUNT(n) FROM Note n GROUP BY n.entityType")
    List<Object[]> countNotesByEntityType();

    @Query("SELECT n.entityType, COUNT(n) FROM Note n WHERE n.authorDepartmentId = :deptId OR n.authorId = :userId GROUP BY n.entityType")
    List<Object[]> countNotesByEntityTypeForDepartment(@Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT n.entityType, COUNT(n) FROM Note n WHERE n.authorId = :userId GROUP BY n.entityType")
    List<Object[]> countNotesByEntityTypeForUser(@Param("userId") Long userId);
}
