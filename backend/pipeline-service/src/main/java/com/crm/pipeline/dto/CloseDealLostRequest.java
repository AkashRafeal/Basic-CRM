package com.crm.pipeline.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CloseDealLostRequest {

    @NotBlank(message = "Loss reason is required")
    private String lossReason;
}
