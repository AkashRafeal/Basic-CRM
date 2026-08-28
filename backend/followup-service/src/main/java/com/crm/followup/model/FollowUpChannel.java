package com.crm.followup.model;

public enum FollowUpChannel {
    PHONE_CALL("Phone Call"),
    EMAIL("Email"),
    VIDEO_CONFERENCE("Video Conference"),
    IN_PERSON_MEETING("In-Person Meeting"),
    WHATSAPP_SMS("WhatsApp / SMS"),
    LINKEDIN_MESSAGE("LinkedIn Message"),
    OTHER("Other");

    private final String displayName;

    FollowUpChannel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
