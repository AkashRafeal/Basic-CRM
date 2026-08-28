package com.crm.task.controller;

import com.crm.task.common.ApiResponse;
import com.crm.task.dto.*;
import com.crm.task.model.*;
import com.crm.task.security.UserPrincipal;
import com.crm.task.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
@Tag(name = "Task Management", description = "Endpoints for managing CRM tasks, due dates, priority assignments, and activity metrics")
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Search and list CRM tasks with multi-criteria filtering")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getAllTasks(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) TaskType taskType,
            @RequestParam(required = false) Long assignedId,
            @RequestParam(required = false) RelatedEntityType relatedType
    ) {
        List<TaskResponse> tasks = taskService.searchTasks(search, status, priority, taskType, assignedId, relatedType);
        return ResponseEntity.ok(ApiResponse.ok("Tasks retrieved successfully", tasks));
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get tasks assigned to the currently authenticated user")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks(@AuthenticationPrincipal UserPrincipal principal) {
        List<TaskResponse> tasks = taskService.getMyTasks(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok("My tasks retrieved successfully", tasks));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get task metrics, pending vs completed counts, and overdue totals")
    public ResponseEntity<ApiResponse<TaskStatsResponse>> getTaskStats() {
        TaskStatsResponse stats = taskService.getTaskStats();
        return ResponseEntity.ok(ApiResponse.ok("Task statistics retrieved successfully", stats));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get single task details by ID")
    public ResponseEntity<ApiResponse<TaskResponse>> getTaskById(@PathVariable Long id) {
        TaskResponse task = taskService.getTaskById(id);
        return ResponseEntity.ok(ApiResponse.ok("Task retrieved successfully", task));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create a new task")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TaskResponse created = taskService.createTask(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Task created successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update task details")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        TaskResponse updated = taskService.updateTask(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Task updated successfully", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Quick toggle task status")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTaskStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTaskStatusRequest request
    ) {
        TaskResponse updated = taskService.updateTaskStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Task status updated successfully", updated));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Assign or reassign task to team member")
    public ResponseEntity<ApiResponse<TaskResponse>> assignTask(
            @PathVariable Long id,
            @Valid @RequestBody AssignTaskRequest request
    ) {
        TaskResponse updated = taskService.assignTask(
                id,
                request.getAssignedToUserId(),
                request.getAssignedToUserName()
        );
        return ResponseEntity.ok(ApiResponse.ok("Task assigned successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Delete a task subject to role-based manager restrictions")
    public ResponseEntity<ApiResponse<Void>> deleteTask(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") Boolean permanent,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        taskService.deleteTask(id, principal, permanent);
        return ResponseEntity.ok(ApiResponse.ok("Task deleted successfully", null));
    }
}
