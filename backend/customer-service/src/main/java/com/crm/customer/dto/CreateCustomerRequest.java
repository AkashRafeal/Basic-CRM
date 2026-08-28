package com.crm.customer.dto;

import com.crm.customer.model.CustomerStatus;
import com.crm.customer.model.CustomerTier;
import com.crm.customer.model.Industry;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateCustomerRequest {

    @NotBlank(message = "Customer/Account name is required")
    @Size(max = 150, message = "Customer name must not exceed 150 characters")
    private String name;

    @Size(max = 120, message = "Contact person name must not exceed 120 characters")
    private String contactPerson;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    private String email;

    @Size(max = 50, message = "Phone must not exceed 50 characters")
    private String phone;

    @Size(max = 150, message = "Company name must not exceed 150 characters")
    private String company;

    @Size(max = 200, message = "Website must not exceed 200 characters")
    private String website;

    private Industry industry;

    private CustomerTier customerTier;

    private CustomerStatus customerStatus;

    @PositiveOrZero(message = "Annual revenue must be zero or positive")
    private BigDecimal annualRevenue;

    @Size(max = 300, message = "Billing address must not exceed 300 characters")
    private String billingAddress;

    private String notes;

    private Long assignedAccountManagerId;

    private String assignedAccountManagerName;

    private Long convertedFromLeadId;

    private Long createdByUserId;

    private String createdByUserName;

    private String createdByRole;
}
