package com.crm.pipeline.dto;

import com.crm.pipeline.model.DealStage;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PipelineSummaryResponse {

    private DealStage stage;
    private String stageDisplayName;
    private int defaultProbability;
    private long count;
    private BigDecimal totalValue;
    private BigDecimal weightedValue;
    private List<DealResponse> deals;
}
