package com.crm.followup.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "crm_followup_cadence_configs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FollowUpCadenceConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(name = "cadence_name", length = 100)
    private String cadenceName = "Standard Enterprise Inbound Sequence";

    @Builder.Default
    @Column(name = "initial_touchpoint_hours")
    private Integer initialTouchpointHours = 2; // Day 1: 2-hour response SLA

    @Builder.Default
    @Column(name = "second_touchpoint_days")
    private Integer secondTouchpointDays = 2; // Day 3: Follow-up check-in

    @Builder.Default
    @Column(name = "third_touchpoint_days")
    private Integer thirdTouchpointDays = 5; // Day 7: Strategic proposal review

    @Builder.Default
    @Column(name = "max_attempts_before_dormant")
    private Integer maxAttemptsBeforeDormant = 5;

    @Builder.Default
    @Column(name = "auto_escalate_overdue_hours")
    private Integer autoEscalateOverdueHours = 24;

    @Builder.Default
    @Column(name = "enable_sms_reminders")
    private Boolean enableSmsReminders = true;

    @Builder.Default
    @Column(name = "enable_email_cadence")
    private Boolean enableEmailCadence = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
