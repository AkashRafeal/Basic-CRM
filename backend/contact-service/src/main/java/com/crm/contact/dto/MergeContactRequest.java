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
public class MergeContactRequest {
    @NotNull(message = "Primary contact ID is required")
    private Long primaryContactId;

    @NotNull(message = "Duplicate contact ID to merge is required")
    private Long duplicateContactId;
}
