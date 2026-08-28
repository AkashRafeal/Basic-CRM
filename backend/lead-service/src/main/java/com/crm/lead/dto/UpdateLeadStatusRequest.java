package com.crm.lead.dto;

import com.crm.lead.model.LeadStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLeadStatusRequest {

    @NotNull(message = "Lead status is required")
    private LeadStatus leadStatus;
}
