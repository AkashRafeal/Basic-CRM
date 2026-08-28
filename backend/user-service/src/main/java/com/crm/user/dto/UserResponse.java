package com.crm.user.dto;

import com.crm.user.model.Role;
import com.crm.user.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String roleName;
    private String department;
    private Long departmentId;
    private String phoneNumber;
    private Long managerId;
    private String managerName;
    private String teamName;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .roleName(user.getRole().getCleanName())
                .department(user.getDepartment())
                .departmentId(user.getDepartmentId())
                .phoneNumber(user.getPhoneNumber())
                .managerId(user.getManagerId())
                .teamName(user.getTeamName())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}
