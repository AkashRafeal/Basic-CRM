package com.crm.auth.model;

public enum Role {
    ROLE_ADMIN,
    ROLE_MANAGER,
    ROLE_EMPLOYEE;

    public String getCleanName() {
        return name().replace("ROLE_", "");
    }
}
