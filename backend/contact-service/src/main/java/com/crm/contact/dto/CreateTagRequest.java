package com.crm.contact.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTagRequest {
    @NotBlank(message = "Tag name is required")
    private String name;

    @Builder.Default
    private String color = "indigo";

    private String description;
}
