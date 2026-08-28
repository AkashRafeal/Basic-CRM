package com.crm.call.dto;

import com.crm.call.model.CallPurpose;
import com.crm.call.model.RelatedEntityType;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InitiateCallRequest {

    @NotBlank(message = "Outbound caller number (from number) is required")
    private String fromNumber; // Number given by user

    @NotBlank(message = "Destination phone number (to number) is required")
    private String toNumber; // Customer or lead phone number

    private String customerName;

    private String contactEmail;

    private CallPurpose purpose;

    private String title;

    private RelatedEntityType relatedToType;

    private Long relatedToId;

    private String relatedToName;

    private Long assignedToUserId;

    private String assignedToUserName;

    private String agenda;

    private String notes;
}
