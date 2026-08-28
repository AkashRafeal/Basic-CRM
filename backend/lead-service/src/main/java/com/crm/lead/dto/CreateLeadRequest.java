package com.crm.lead.dto;

import com.crm.lead.model.LeadSource;
import com.crm.lead.model.LeadStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLeadRequest {

    @NotBlank(message = "First name is required")
    @Size(min = 1, max = 100, message = "First name must be between 1 and 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name cannot exceed 100 characters")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private String company;

    private String jobTitle;

    @Builder.Default
    private LeadStatus leadStatus = LeadStatus.NEW;

    @Builder.Default
    private LeadSource leadSource = LeadSource.WEBSITE;

    private BigDecimal estimatedValue;

    private Integer score;

    private String notes;

    private Long assignedToUserId;

    private String assignedToUserName;

    private java.util.List<Long> interestedProductIds;
}
