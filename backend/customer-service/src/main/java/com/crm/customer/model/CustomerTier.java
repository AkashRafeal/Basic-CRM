package com.crm.customer.model;

public enum CustomerTier {
    TIER_1_ENTERPRISE("Tier 1 - Enterprise"),
    TIER_2_MID_MARKET("Tier 2 - Mid Market"),
    TIER_3_SMB("Tier 3 - Small & Medium Business"),
    STRATEGIC("Strategic Partner");

    private final String displayName;

    CustomerTier(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
