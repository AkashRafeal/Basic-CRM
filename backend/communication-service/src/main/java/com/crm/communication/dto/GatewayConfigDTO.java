package com.crm.communication.dto;

import com.crm.communication.model.CommunicationGatewayConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GatewayConfigDTO {

    private Long id;
    private Boolean smtpEnabled;
    private String smtpHost;
    private Integer smtpPort;
    private String smtpUsername;
    private String smtpFromName;

    private Boolean smsEnabled;
    private String twilioAccountSid;
    private String twilioSenderNumber;

    private Boolean whatsappEnabled;
    private String whatsappPhoneNumberId;
    private String whatsappBusinessAccountId;

    private String webhookUrl;
    private LocalDateTime updatedAt;

    public static GatewayConfigDTO fromEntity(CommunicationGatewayConfig entity) {
        if (entity == null) return null;
        return GatewayConfigDTO.builder()
                .id(entity.getId())
                .smtpEnabled(entity.getSmtpEnabled())
                .smtpHost(entity.getSmtpHost())
                .smtpPort(entity.getSmtpPort())
                .smtpUsername(entity.getSmtpUsername())
                .smtpFromName(entity.getSmtpFromName())
                .smsEnabled(entity.getSmsEnabled())
                .twilioAccountSid(entity.getTwilioAccountSid())
                .twilioSenderNumber(entity.getTwilioSenderNumber())
                .whatsappEnabled(entity.getWhatsappEnabled())
                .whatsappPhoneNumberId(entity.getWhatsappPhoneNumberId())
                .whatsappBusinessAccountId(entity.getWhatsappBusinessAccountId())
                .webhookUrl(entity.getWebhookUrl())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
