package com.crm.product.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrincipal implements Serializable {
    private Long id;
    private String email;
    private String name;
    private String role;
    private Long departmentId;
    private String departmentName;
    private Long managerId;

    public boolean isAdmin() {
        return "ROLE_ADMIN".equalsIgnoreCase(role) || "ADMIN".equalsIgnoreCase(role);
    }

    public boolean isManager() {
        return "ROLE_MANAGER".equalsIgnoreCase(role) || "MANAGER".equalsIgnoreCase(role);
    }

    public boolean isEmployee() {
        return "ROLE_EMPLOYEE".equalsIgnoreCase(role) || "EMPLOYEE".equalsIgnoreCase(role);
    }
}
