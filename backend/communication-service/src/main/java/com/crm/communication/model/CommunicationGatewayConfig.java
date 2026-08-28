package com.crm.communication.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_communication_gateway_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommunicationGatewayConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email SMTP Gateway
    @Builder.Default
    @Column(name = "smtp_enabled")
    private Boolean smtpEnabled = true;

    @Builder.Default
    @Column(name = "smtp_host", length = 150)
    private String smtpHost = "smtp.crm-mail.com";

    @Builder.Default
    @Column(name = "smtp_port")
    private Integer smtpPort = 587;

    @Builder.Default
    @Column(name = "smtp_username", length = 100)
    private String smtpUsername = "notifications@basic-crm.com";

    @Builder.Default
    @Column(name = "smtp_from_name", length = 100)
    private String smtpFromName = "Basic CRM Enterprise";

    // SMS Twilio Gateway
    @Builder.Default
    @Column(name = "sms_enabled")
    private Boolean smsEnabled = true;

    @Builder.Default
    @Column(name = "twilio_account_sid", length = 100)
    private String twilioAccountSid = "AC_demo_twilio_sid_98742";

    @Builder.Default
    @Column(name = "twilio_sender_number", length = 50)
    private String twilioSenderNumber = "+1 (800) 555-0199";

    // WhatsApp Cloud Gateway
    @Builder.Default
    @Column(name = "whatsapp_enabled")
    private Boolean whatsappEnabled = true;

    @Builder.Default
    @Column(name = "whatsapp_phone_number_id", length = 100)
    private String whatsappPhoneNumberId = "WA_PHONE_ID_1048576";

    @Builder.Default
    @Column(name = "whatsapp_business_account_id", length = 100)
    private String whatsappBusinessAccountId = "WABA_ID_9928374";

    // Webhook Gateway
    @Builder.Default
    @Column(name = "webhook_url", length = 300)
    private String webhookUrl = "https://api.basic-crm.com/v1/webhooks/incoming-events";

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
