package com.crm.user.controller;

import com.crm.user.common.ApiResponse;
import com.crm.user.dto.*;
import com.crm.user.model.Role;
import com.crm.user.security.UserPrincipal;
import com.crm.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management & RBAC", description = "User management microservice endpoints")
public class UserController {

    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create user", description = "Create a new user (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return new ResponseEntity<>(ApiResponse.success("User created successfully", response), HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get all users", description = "List users with optional search and role/status filters")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) Boolean active) {
        List<UserResponse> users = userService.getAllUsers(search, role, active);
        return ResponseEntity.ok(ApiResponse.success("Users fetched successfully", users));
    }

    @GetMapping("/team-members")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Get team members", description = "List team members managed by calling manager")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getTeamMembers(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<UserResponse> members = userService.getTeamMembers(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("Team members fetched successfully", members));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER') or #id == principal.id")
    @Operation(summary = "Get user by ID", description = "Fetch user details (Admin, Manager, or Self)")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User fetched successfully", user));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    @Operation(summary = "Update user profile", description = "Update user profile fields (Admin or Self)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {
        UserResponse updated = userService.updateUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", updated));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user role", description = "Promote or demote user role (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse updated = userService.updateUserRole(id, request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", updated));
    }

    @PatchMapping("/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle user status", description = "Enable or disable user account (Admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> toggleUserStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserResponse updated = userService.toggleUserStatus(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", updated));
    }

    @PutMapping("/{id}/change-password")
    @Operation(summary = "Change password", description = "User self-service password update")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @PathVariable Long id,
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (!currentUser.getId().equals(id)) {
            throw new AccessDeniedException("You can only change your own password.");
        }
        userService.changePassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PutMapping("/{id}/admin-reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin reset password", description = "Administrator overrides user password (Admin only)")
    public ResponseEntity<ApiResponse<Void>> adminResetPassword(
            @PathVariable Long id,
            @Valid @RequestBody AdminResetPasswordRequest request) {
        userService.adminResetPassword(id, request);
        return ResponseEntity.ok(ApiResponse.success("User password reset successfully", null));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user", description = "Permanently remove a user account (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        userService.deleteUser(id, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success("User deleted successfully", null));
    }
}
