package com.crm.customer.dto;

import com.crm.customer.model.CustomerStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateCustomerStatusRequest {

    @NotNull(message = "Customer status is required")
    private CustomerStatus customerStatus;
}
