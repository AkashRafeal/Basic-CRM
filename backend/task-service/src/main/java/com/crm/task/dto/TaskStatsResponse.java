package com.crm.task.dto;

import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TaskStatsResponse {

    private long totalTasks;
    private long todoTasks;
    private long inProgressTasks;
    private long completedTasks;
    private long cancelledTasks;
    private long overdueTasks;
    private double completionRate;
    private Map<String, Long> tasksByPriority;
    private Map<String, Long> tasksByStatus;
    private Map<String, Long> tasksByType;
}
