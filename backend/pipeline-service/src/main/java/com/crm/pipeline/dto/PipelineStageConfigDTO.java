package com.crm.pipeline.dto;

import com.crm.pipeline.model.DealStage;
import com.crm.pipeline.model.PipelineStageConfig;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineStageConfigDTO {

    private Long id;
    private DealStage stage;
    private String displayName;
    private Integer probability;
    private Integer stageOrder;
    private String color;
    private String description;
    private Boolean isActive;

    public static PipelineStageConfigDTO fromEntity(PipelineStageConfig entity) {
        if (entity == null) return null;
        return PipelineStageConfigDTO.builder()
                .id(entity.getId())
                .stage(entity.getStage())
                .displayName(entity.getDisplayName())
                .probability(entity.getProbability())
                .stageOrder(entity.getStageOrder())
                .color(entity.getColor())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .build();
    }
}
