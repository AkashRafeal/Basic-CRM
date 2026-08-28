package com.crm.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentStatsResponse {

    private long totalAppointments;
    private long scheduledUpcoming;
    private long completedCount;
    private long todayAppointments;
    private long cancelledCount;
    private long noShowCount;
    private double showUpRatePercent;

    private Map<String, Long> countByType;
    private Map<String, Long> countByMode;
    private Map<String, Long> countByStatus;
}
