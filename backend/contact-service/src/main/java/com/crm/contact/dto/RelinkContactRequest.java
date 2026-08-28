package com.crm.contact.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RelinkContactRequest {
    @NotNull(message = "New customer ID is required")
    private Long customerId;
    private String customerName;
}
