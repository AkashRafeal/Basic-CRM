package com.crm.product.model;

public enum ProductCategory {
    SOFTWARE_SAAS("Software & SaaS Subscriptions"),
    CLOUD_INFRASTRUCTURE("Cloud & Hosting Infrastructure"),
    CONSULTING_SERVICES("Professional Consulting & Implementation"),
    SUPPORT_MAINTENANCE("Annual Support & SLA Maintenance"),
    HARDWARE_EQUIPMENT("Hardware & Telephony Equipment"),
    ENTERPRISE_LICENSE("Perpetual Enterprise License"),
    TRAINING_ONBOARDING("Training, Workshop & Onboarding"),
    CUSTOM_DEVELOPMENT("Custom Integration & Development");

    private final String displayName;

    ProductCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
