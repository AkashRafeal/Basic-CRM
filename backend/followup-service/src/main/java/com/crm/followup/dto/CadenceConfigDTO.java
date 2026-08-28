package com.crm.followup.dto;

import com.crm.followup.model.FollowUpCadenceConfig;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CadenceConfigDTO {

    private Long id;
    private String cadenceName;
    private Integer initialTouchpointHours;
    private Integer secondTouchpointDays;
    private Integer thirdTouchpointDays;
    private Integer maxAttemptsBeforeDormant;
    private Integer autoEscalateOverdueHours;
    private Boolean enableSmsReminders;
    private Boolean enableEmailCadence;
    private LocalDateTime updatedAt;

    public static CadenceConfigDTO fromEntity(FollowUpCadenceConfig entity) {
        if (entity == null) return null;
        return CadenceConfigDTO.builder()
                .id(entity.getId())
                .cadenceName(entity.getCadenceName())
                .initialTouchpointHours(entity.getInitialTouchpointHours())
                .secondTouchpointDays(entity.getSecondTouchpointDays())
                .thirdTouchpointDays(entity.getThirdTouchpointDays())
                .maxAttemptsBeforeDormant(entity.getMaxAttemptsBeforeDormant())
                .autoEscalateOverdueHours(entity.getAutoEscalateOverdueHours())
                .enableSmsReminders(entity.getEnableSmsReminders())
                .enableEmailCadence(entity.getEnableEmailCadence())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
