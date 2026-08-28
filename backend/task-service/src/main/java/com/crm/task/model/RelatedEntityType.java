package com.crm.task.model;

public enum RelatedEntityType {
    LEAD("Sales Lead"),
    CUSTOMER("Customer Account"),
    GENERAL("General Task");

    private final String displayName;

    RelatedEntityType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
