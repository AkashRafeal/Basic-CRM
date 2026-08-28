package com.crm.activity.dto;

import com.crm.activity.model.NoteVisibility;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateNoteRequest {

    @NotBlank(message = "Note title is required")
    private String title;

    @NotBlank(message = "Note content is required")
    private String content;

    private Boolean isPinned;

    private String colorTag;

    private NoteVisibility visibility;

    private String tags;
}
