package com.crm.lead.model;

public enum LeadSource {
    WEBSITE,
    REFERRAL,
    COLD_CALL,
    EMAIL_CAMPAIGN,
    SOCIAL_MEDIA,
    EVENT,
    OTHER;

    public String getDisplayName() {
        return name().replace("_", " ");
    }
}
