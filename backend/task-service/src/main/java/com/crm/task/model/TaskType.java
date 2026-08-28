package com.crm.task.model;

public enum TaskType {
    FOLLOW_UP("Follow-up"),
    CALL("Phone Call"),
    MEETING("Client Meeting"),
    EMAIL("Email Outreach"),
    PROPOSAL("Prepare Proposal"),
    ONBOARDING("Client Onboarding"),
    OTHER("General Task");

    private final String displayName;

    TaskType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
