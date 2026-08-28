package com.crm.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConfigRequest {
    private boolean googleMeetEnabled;
    private String googleWorkspaceDomain;

    private boolean zoomEnabled;
    private String zoomAccountId;
    private String zoomClientId;

    private boolean msTeamsEnabled;
    private String msTeamsTenantId;

    private boolean autoSyncCalendar;
    private String webhookUrl;
}
