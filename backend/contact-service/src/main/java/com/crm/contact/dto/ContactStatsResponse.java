package com.crm.contact.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactStatsResponse {

    private long totalContacts;
    private long activeContacts;
    private long primaryContacts;
    private long decisionMakers;
    private long champions;
    private long accountsCovered;
    private long archivedContacts;
    private Map<String, Long> contactsByType;
    private Map<String, Long> contactsByStatus;
}
