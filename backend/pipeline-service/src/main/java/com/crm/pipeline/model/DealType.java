package com.crm.pipeline.model;

public enum DealType {
    NEW_BUSINESS("New Business"),
    EXISTING_BUSINESS("Existing Business"),
    EXPANSION_UPSELL("Expansion / Upsell"),
    RENEWAL("Contract Renewal");

    private final String displayName;

    DealType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
