package com.crm.followup.model;

public enum TargetType {
    LEAD("Sales Lead"),
    CUSTOMER("Customer Account"),
    CONTACT("Individual Contact");

    private final String displayName;

    TargetType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
