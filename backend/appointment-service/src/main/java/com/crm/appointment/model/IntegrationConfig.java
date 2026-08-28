package com.crm.appointment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "appointment_integrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntegrationConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String providerKey; // e.g. "DEFAULT_INTEGRATION"

    @Column(nullable = false)
    @Builder.Default
    private boolean googleMeetEnabled = true;

    private String googleWorkspaceDomain;

    @Column(nullable = false)
    @Builder.Default
    private boolean zoomEnabled = true;

    private String zoomAccountId;
    private String zoomClientId;

    @Column(nullable = false)
    @Builder.Default
    private boolean msTeamsEnabled = true;

    private String msTeamsTenantId;

    @Column(nullable = false)
    @Builder.Default
    private boolean autoSyncCalendar = true;

    private String webhookUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
