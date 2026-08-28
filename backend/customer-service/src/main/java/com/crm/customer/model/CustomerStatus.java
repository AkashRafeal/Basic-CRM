package com.crm.customer.model;

public enum CustomerStatus {
    ACTIVE("Active Account"),
    ONBOARDING("Onboarding"),
    AT_RISK("At Risk"),
    CHURNED("Churned"),
    INACTIVE("Inactive");

    private final String displayName;

    CustomerStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
