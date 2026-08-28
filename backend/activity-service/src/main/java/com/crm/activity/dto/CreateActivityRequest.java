package com.crm.activity.dto;

import com.crm.activity.model.ActivityType;
import com.crm.activity.model.EntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateActivityRequest {

    @NotNull(message = "Activity type is required")
    private ActivityType activityType;

    @NotBlank(message = "Activity title is required")
    private String title;

    private String description;

    private EntityType entityType;

    private Long entityId;

    private String entityTitle;

    private String metadataJson;
}
