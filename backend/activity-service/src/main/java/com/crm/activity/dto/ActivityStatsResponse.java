package com.crm.activity.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityStatsResponse {

    private long totalActivities;
    private long totalNotes;
    private long pinnedNotes;
    private long todayActivities;
    private Map<String, Long> activitiesByType;
    private Map<String, Long> notesByEntity;
}
