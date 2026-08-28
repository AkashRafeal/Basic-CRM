package com.crm.product.model;

public enum BillingFrequency {
    ONE_TIME("One-Time Purchase"),
    MONTHLY("Monthly Subscription"),
    QUARTERLY("Quarterly Billing"),
    ANNUALLY("Annual Contract"),
    USAGE_BASED("Usage / Consumption Based");

    private final String displayName;

    BillingFrequency(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
