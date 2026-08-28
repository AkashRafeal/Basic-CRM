package com.crm.user.controller;

import com.crm.user.common.ApiResponse;
import com.crm.user.dto.CreateDepartmentRequest;
import com.crm.user.dto.DepartmentDTO;
import com.crm.user.dto.DepartmentHierarchyDTO;
import com.crm.user.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Department Management", description = "Department organization & hierarchy endpoints")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @Operation(summary = "Get all departments", description = "List all active departments in organization")
    public ResponseEntity<ApiResponse<List<DepartmentDTO>>> getAllDepartments() {
        List<DepartmentDTO> departments = departmentService.getAllDepartments();
        return ResponseEntity.ok(ApiResponse.success("Departments fetched successfully", departments));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create department", description = "Create a new department (Admin only)")
    public ResponseEntity<ApiResponse<DepartmentDTO>> createDepartment(@Valid @RequestBody CreateDepartmentRequest request) {
        DepartmentDTO created = departmentService.createDepartment(request);
        return new ResponseEntity<>(ApiResponse.success("Department created successfully", created), HttpStatus.CREATED);
    }

    @GetMapping("/hierarchy")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get department hierarchy", description = "Complete department -> managers -> employees organizational hierarchy tree")
    public ResponseEntity<ApiResponse<List<DepartmentHierarchyDTO>>> getFullHierarchy() {
        List<DepartmentHierarchyDTO> hierarchy = departmentService.getFullHierarchy();
        return ResponseEntity.ok(ApiResponse.success("Department hierarchy tree fetched successfully", hierarchy));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete department", description = "Delete a department (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted successfully", null));
    }
}
