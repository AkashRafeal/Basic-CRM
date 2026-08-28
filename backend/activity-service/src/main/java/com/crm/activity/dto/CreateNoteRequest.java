package com.crm.activity.dto;

import com.crm.activity.model.EntityType;
import com.crm.activity.model.NoteVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNoteRequest {

    @NotBlank(message = "Note title is required")
    private String title;

    @NotBlank(message = "Note content is required")
    private String content;

    @NotNull(message = "Entity type is required (e.g. LEAD, CUSTOMER, DEAL, CONTACT, PRODUCT, GENERAL)")
    private EntityType entityType;

    private Long entityId;

    private String entityTitle;

    @Builder.Default
    private Boolean isPinned = false;

    @Builder.Default
    private String colorTag = "blue";

    @Builder.Default
    private NoteVisibility visibility = NoteVisibility.PUBLIC_TEAM;

    private String tags;
}
