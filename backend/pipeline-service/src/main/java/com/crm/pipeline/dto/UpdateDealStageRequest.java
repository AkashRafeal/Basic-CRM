package com.crm.pipeline.dto;

import com.crm.pipeline.model.DealStage;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDealStageRequest {

    @NotNull(message = "Deal stage is required")
    private DealStage stage;

    private Integer probability;
}
