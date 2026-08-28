package com.crm.followup.model;

public enum FollowUpStatus {
    SCHEDULED("Scheduled"),
    COMPLETED("Completed"),
    MISSED("Missed / Overdue"),
    RESCHEDULED("Rescheduled"),
    CANCELLED("Cancelled");

    private final String displayName;

    FollowUpStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
