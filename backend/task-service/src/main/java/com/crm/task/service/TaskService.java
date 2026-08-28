package com.crm.task.service;

import com.crm.task.common.ResourceNotFoundException;
import com.crm.task.dto.*;
import com.crm.task.model.*;
import com.crm.task.repository.TaskRepository;
import com.crm.task.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;

    @Transactional(readOnly = true)
    public List<TaskResponse> searchTasks(
            String search,
            TaskStatus status,
            TaskPriority priority,
            TaskType taskType,
            Long assignedId,
            RelatedEntityType relatedType
    ) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return taskRepository.searchTasks(cleanSearch, status, priority, taskType, assignedId, relatedType)
                .stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(Long userId) {
        return taskRepository.findByAssignedToUserIdOrderByDueDateAsc(userId)
                .stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse createTask(CreateTaskRequest request, UserPrincipal currentUser) {
        Long creatorId = currentUser != null ? currentUser.getId() : null;
        String creatorName = currentUser != null ? currentUser.getName() : null;
        String creatorRole = currentUser != null ? currentUser.getRole() : "ROLE_ADMIN";

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .taskType(request.getTaskType() != null ? request.getTaskType() : TaskType.FOLLOW_UP)
                .priority(request.getPriority() != null ? request.getPriority() : TaskPriority.MEDIUM)
                .status(request.getStatus() != null ? request.getStatus() : TaskStatus.TODO)
                .dueDate(request.getDueDate())
                .assignedToUserId(request.getAssignedToUserId())
                .assignedToUserName(request.getAssignedToUserName())
                .relatedEntityType(request.getRelatedEntityType() != null ? request.getRelatedEntityType() : RelatedEntityType.GENERAL)
                .relatedEntityId(request.getRelatedEntityId())
                .relatedEntityName(request.getRelatedEntityName())
                .productId(request.getProductId())
                .productName(request.getProductName())
                .createdByUserId(creatorId)
                .createdByUserName(creatorName)
                .createdByRole(creatorRole)
                .isDeleted(false)
                .build();

        if (task.getStatus() == TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        }

        Task saved = taskRepository.save(task);
        log.info("Created new task '{}' (id: {}) by user {} ({})", saved.getTitle(), saved.getId(), creatorName, creatorRole);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse updateTask(Long id, UpdateTaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        if (request.getTaskType() != null) task.setTaskType(request.getTaskType());
        if (request.getPriority() != null) task.setPriority(request.getPriority());

        if (request.getStatus() != null) {
            if (request.getStatus() == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(LocalDateTime.now());
            } else if (request.getStatus() != TaskStatus.COMPLETED) {
                task.setCompletedAt(null);
            }
            task.setStatus(request.getStatus());
        }

        task.setDueDate(request.getDueDate());
        task.setAssignedToUserId(request.getAssignedToUserId());
        task.setAssignedToUserName(request.getAssignedToUserName());
        if (request.getRelatedEntityType() != null) task.setRelatedEntityType(request.getRelatedEntityType());
        task.setRelatedEntityId(request.getRelatedEntityId());
        task.setRelatedEntityName(request.getRelatedEntityName());
        if (request.getProductId() != null) task.setProductId(request.getProductId());
        if (request.getProductName() != null) task.setProductName(request.getProductName());

        Task saved = taskRepository.save(task);
        log.info("Updated task '{}' (id: {})", saved.getTitle(), saved.getId());
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long id, TaskStatus newStatus) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (newStatus == TaskStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
            task.setCompletedAt(LocalDateTime.now());
        } else if (newStatus != TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
        }

        task.setStatus(newStatus);
        Task saved = taskRepository.save(task);
        log.info("Updated status of task id {} to {}", id, newStatus);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse assignTask(Long id, Long userId, String userName) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        task.setAssignedToUserId(userId);
        task.setAssignedToUserName(userName);
        Task saved = taskRepository.save(task);
        log.info("Assigned task id {} to {}", id, userName);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteTask(Long id, UserPrincipal currentUser, Boolean permanent) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));

        if (Boolean.TRUE.equals(task.getIsDeleted())) {
            throw new ResourceNotFoundException("Task already deleted with id: " + id);
        }

        if (currentUser != null) {
            String role = currentUser.getRole();
            if ("ROLE_MANAGER".equalsIgnoreCase(role) || "MANAGER".equalsIgnoreCase(role)) {
                // Restriction 1: Delete tasks created by Admin
                if ("ROLE_ADMIN".equalsIgnoreCase(task.getCreatedByRole()) || "ADMIN".equalsIgnoreCase(task.getCreatedByRole())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Manager restriction: You cannot delete tasks created by an Administrator."
                    );
                }

                // Restriction 2: Delete another Manager's task
                if (("ROLE_MANAGER".equalsIgnoreCase(task.getCreatedByRole()) || "MANAGER".equalsIgnoreCase(task.getCreatedByRole()))
                        && task.getCreatedByUserId() != null
                        && !task.getCreatedByUserId().equals(currentUser.getId())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Manager restriction: You cannot delete tasks created by another Manager."
                    );
                }

                // Restriction 3: Delete completed tasks
                if (task.getStatus() == TaskStatus.COMPLETED) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Manager restriction: You cannot delete completed tasks. Completed tasks are locked for reporting and audit integrity."
                    );
                }

                // Restriction 4: Permanently delete any task
                if (Boolean.TRUE.equals(permanent)) {
                    throw new org.springframework.web.server.ResponseStatusException(
                            org.springframework.http.HttpStatus.FORBIDDEN,
                            "Manager restriction: Managers cannot permanently delete any task. Only Administrators have permanent deletion privileges."
                    );
                }

                // Soft delete
                task.setIsDeleted(true);
                task.setDeletedAt(LocalDateTime.now());
                taskRepository.save(task);
                log.info("Manager {} (id: {}) soft-deleted task id {}", currentUser.getName(), currentUser.getId(), id);
                return;
            } else if ("ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role)) {
                if (Boolean.TRUE.equals(permanent)) {
                    taskRepository.delete(task);
                    log.info("Administrator {} permanently deleted task id {}", currentUser.getName(), id);
                } else {
                    task.setIsDeleted(true);
                    task.setDeletedAt(LocalDateTime.now());
                    taskRepository.save(task);
                    log.info("Administrator {} soft-deleted task id {}", currentUser.getName(), id);
                }
                return;
            }
        }

        // Fallback default
        task.setIsDeleted(true);
        task.setDeletedAt(LocalDateTime.now());
        taskRepository.save(task);
        log.info("Deleted task id {}", id);
    }

    @Transactional(readOnly = true)
    public TaskStatsResponse getTaskStats() {
        long totalTasks = taskRepository.countActiveTasks();
        long todoTasks = taskRepository.countByStatus(TaskStatus.TODO);
        long inProgressTasks = taskRepository.countByStatus(TaskStatus.IN_PROGRESS);
        long completedTasks = taskRepository.countByStatus(TaskStatus.COMPLETED);
        long cancelledTasks = taskRepository.countByStatus(TaskStatus.CANCELLED);
        long overdueTasks = taskRepository.countOverdueTasks(LocalDate.now());

        double completionRate = 0.0;
        if (totalTasks > 0) {
            completionRate = Math.round(((double) completedTasks / totalTasks) * 1000.0) / 10.0;
        }

        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (TaskPriority priority : TaskPriority.values()) {
            byPriority.put(priority.name(), taskRepository.countByPriority(priority));
        }

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            byStatus.put(status.name(), taskRepository.countByStatus(status));
        }

        Map<String, Long> byType = new LinkedHashMap<>();
        for (TaskType type : TaskType.values()) {
            byType.put(type.name(), 0L);
        }
        List<Task> allTasks = taskRepository.findAllActiveTasks();
        for (Task t : allTasks) {
            if (t.getTaskType() != null) {
                byType.put(t.getTaskType().name(), byType.getOrDefault(t.getTaskType().name(), 0L) + 1L);
            }
        }

        return TaskStatsResponse.builder()
                .totalTasks(totalTasks)
                .todoTasks(todoTasks)
                .inProgressTasks(inProgressTasks)
                .completedTasks(completedTasks)
                .cancelledTasks(cancelledTasks)
                .overdueTasks(overdueTasks)
                .completionRate(completionRate)
                .tasksByPriority(byPriority)
                .tasksByStatus(byStatus)
                .tasksByType(byType)
                .build();
    }
}
