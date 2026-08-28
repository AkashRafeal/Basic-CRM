package com.crm.communication.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateGatewayConfigRequest {

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
}
