package com.crm.lead.model;

public enum LeadStatus {
    NEW,
    CONTACTED,
    QUALIFIED,
    PROPOSAL_SENT,
    NEGOTIATING,
    CONVERTED,
    LOST;

    public String getDisplayName() {
        return name().replace("_", " ");
    }
}
