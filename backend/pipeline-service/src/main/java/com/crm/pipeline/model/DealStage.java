package com.crm.pipeline.model;

public enum DealStage {
    QUALIFICATION("Qualification", 10),
    DISCOVERY("Discovery & Demo", 30),
    PROPOSAL("Proposal / Quote", 60),
    NEGOTIATION("Negotiation & Review", 80),
    CLOSED_WON("Closed Won", 100),
    CLOSED_LOST("Closed Lost", 0);

    private final String displayName;
    private final int defaultProbability;

    DealStage(String displayName, int defaultProbability) {
        this.displayName = displayName;
        this.defaultProbability = defaultProbability;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getDefaultProbability() {
        return defaultProbability;
    }
}
