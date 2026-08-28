package com.crm.appointment.repository;

import com.crm.appointment.model.Appointment;
import com.crm.appointment.model.AppointmentStatus;
import com.crm.appointment.model.EntityType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long>, JpaSpecificationExecutor<Appointment> {

    List<Appointment> findByEntityTypeAndEntityIdOrderByStartTimeAsc(EntityType entityType, Long entityId);

    List<Appointment> findByOrganizerIdAndStartTimeBetweenOrderByStartTimeAsc(Long organizerId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByStartTimeBetweenOrderByStartTimeAsc(LocalDateTime start, LocalDateTime end);

    List<Appointment> findByOrganizerDepartmentIdAndStartTimeBetweenOrderByStartTimeAsc(Long deptId, LocalDateTime start, LocalDateTime end);

    @Query("SELECT a FROM Appointment a WHERE a.startTime BETWEEN :start AND :end ORDER BY a.startTime ASC")
    List<Appointment> findInDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Global Stats
    long countByStatus(AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.startTime >= :start AND a.startTime <= :end")
    long countBetweenDates(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT a.meetingType, COUNT(a) FROM Appointment a GROUP BY a.meetingType")
    List<Object[]> countByMeetingType();

    @Query("SELECT a.meetingMode, COUNT(a) FROM Appointment a GROUP BY a.meetingMode")
    List<Object[]> countByMeetingMode();

    @Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countByStatusGroup();

    // Department / Team Stats
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.organizerDepartmentId = :deptId OR a.organizerId = :userId")
    long countByDepartmentOrOrganizer(@Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE (a.organizerDepartmentId = :deptId OR a.organizerId = :userId) AND a.status = :status")
    long countByDepartmentAndStatus(@Param("deptId") Long deptId, @Param("userId") Long userId, @Param("status") AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE (a.organizerDepartmentId = :deptId OR a.organizerId = :userId) AND a.startTime >= :start AND a.startTime <= :end")
    long countBetweenDatesForDepartment(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT a.meetingType, COUNT(a) FROM Appointment a WHERE a.organizerDepartmentId = :deptId OR a.organizerId = :userId GROUP BY a.meetingType")
    List<Object[]> countByMeetingTypeForDepartment(@Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT a.meetingMode, COUNT(a) FROM Appointment a WHERE a.organizerDepartmentId = :deptId OR a.organizerId = :userId GROUP BY a.meetingMode")
    List<Object[]> countByMeetingModeForDepartment(@Param("deptId") Long deptId, @Param("userId") Long userId);

    @Query("SELECT a.status, COUNT(a) FROM Appointment a WHERE a.organizerDepartmentId = :deptId OR a.organizerId = :userId GROUP BY a.status")
    List<Object[]> countByStatusGroupForDepartment(@Param("deptId") Long deptId, @Param("userId") Long userId);

    // Personal User Stats
    long countByOrganizerId(Long organizerId);

    long countByOrganizerIdAndStatus(Long organizerId, AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.organizerId = :userId AND a.startTime >= :start AND a.startTime <= :end")
    long countBetweenDatesForUser(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end, @Param("userId") Long userId);

    @Query("SELECT a.meetingType, COUNT(a) FROM Appointment a WHERE a.organizerId = :userId GROUP BY a.meetingType")
    List<Object[]> countByMeetingTypeForUser(@Param("userId") Long userId);

    @Query("SELECT a.meetingMode, COUNT(a) FROM Appointment a WHERE a.organizerId = :userId GROUP BY a.meetingMode")
    List<Object[]> countByMeetingModeForUser(@Param("userId") Long userId);

    @Query("SELECT a.status, COUNT(a) FROM Appointment a WHERE a.organizerId = :userId GROUP BY a.status")
    List<Object[]> countByStatusGroupForUser(@Param("userId") Long userId);
}
