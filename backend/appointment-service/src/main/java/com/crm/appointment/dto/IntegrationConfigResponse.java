package com.crm.appointment.dto;

import com.crm.appointment.model.IntegrationConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConfigResponse {
    private Long id;
    private String providerKey;
    private boolean googleMeetEnabled;
    private String googleWorkspaceDomain;
    private boolean zoomEnabled;
    private String zoomAccountId;
    private String zoomClientId;
    private boolean msTeamsEnabled;
    private String msTeamsTenantId;
    private boolean autoSyncCalendar;
    private String webhookUrl;
    private LocalDateTime updatedAt;

    public static IntegrationConfigResponse fromEntity(IntegrationConfig config) {
        if (config == null) return null;
        return IntegrationConfigResponse.builder()
                .id(config.getId())
                .providerKey(config.getProviderKey())
                .googleMeetEnabled(config.isGoogleMeetEnabled())
                .googleWorkspaceDomain(config.getGoogleWorkspaceDomain())
                .zoomEnabled(config.isZoomEnabled())
                .zoomAccountId(config.getZoomAccountId())
                .zoomClientId(config.getZoomClientId())
                .msTeamsEnabled(config.isMsTeamsEnabled())
                .msTeamsTenantId(config.getMsTeamsTenantId())
                .autoSyncCalendar(config.isAutoSyncCalendar())
                .webhookUrl(config.getWebhookUrl())
                .updatedAt(config.getUpdatedAt())
                .build();
    }
}
