package com.crm.pipeline.dto;

import com.crm.pipeline.model.DealStage;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePipelineStageConfigRequest {

    @NotNull(message = "Stage is required")
    private DealStage stage;

    @NotBlank(message = "Display name is required")
    private String displayName;

    @NotNull(message = "Probability is required")
    @Min(value = 0, message = "Probability cannot be less than 0%")
    @Max(value = 100, message = "Probability cannot be greater than 100%")
    private Integer probability;

    private Integer stageOrder;
    private String color;
    private String description;
    private Boolean isActive;
}
