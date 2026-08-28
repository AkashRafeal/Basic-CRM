package com.crm.followup.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCadenceConfigRequest {

    private String cadenceName;
    private Integer initialTouchpointHours;
    private Integer secondTouchpointDays;
    private Integer thirdTouchpointDays;
    private Integer maxAttemptsBeforeDormant;
    private Integer autoEscalateOverdueHours;
    private Boolean enableSmsReminders;
    private Boolean enableEmailCadence;
}
