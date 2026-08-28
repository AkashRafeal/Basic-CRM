package com.crm.activity.dto;

import com.crm.activity.model.ActivityLog;
import com.crm.activity.model.ActivityType;
import com.crm.activity.model.EntityType;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResponse {

    private Long id;
    private ActivityType activityType;
    private String title;
    private String description;
    private EntityType entityType;
    private Long entityId;
    private String entityTitle;
    private String metadataJson;
    private Long actorId;
    private String actorName;
    private String actorRole;
    private LocalDateTime createdAt;

    public static ActivityResponse fromEntity(ActivityLog act) {
        return ActivityResponse.builder()
                .id(act.getId())
                .activityType(act.getActivityType())
                .title(act.getTitle())
                .description(act.getDescription())
                .entityType(act.getEntityType())
                .entityId(act.getEntityId())
                .entityTitle(act.getEntityTitle())
                .metadataJson(act.getMetadataJson())
                .actorId(act.getActorId())
                .actorName(act.getActorName())
                .actorRole(act.getActorRole())
                .createdAt(act.getCreatedAt())
                .build();
    }
}
