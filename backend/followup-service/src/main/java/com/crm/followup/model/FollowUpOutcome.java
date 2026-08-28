package com.crm.followup.model;

public enum FollowUpOutcome {
    PENDING("Pending Interaction"),
    INTERESTED("Client Interested"),
    PROPOSAL_REQUESTED("Proposal Requested"),
    MEETING_BOOKED("Meeting Booked"),
    CALLBACK_REQUESTED("Callback Requested"),
    NOT_INTERESTED("Not Interested"),
    NO_ANSWER("No Answer / Voicemail"),
    DEAL_WON("Deal Won"),
    DEAL_LOST("Deal Lost");

    private final String displayName;

    FollowUpOutcome(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
