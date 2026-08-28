package com.crm.activity.dto;

import com.crm.activity.model.EntityType;
import com.crm.activity.model.Note;
import com.crm.activity.model.NoteVisibility;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoteResponse {

    private Long id;
    private String title;
    private String content;
    private EntityType entityType;
    private Long entityId;
    private String entityTitle;
    private Boolean isPinned;
    private String colorTag;
    private NoteVisibility visibility;
    private String tags;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private String authorEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static NoteResponse fromEntity(Note note) {
        return NoteResponse.builder()
                .id(note.getId())
                .title(note.getTitle())
                .content(note.getContent())
                .entityType(note.getEntityType())
                .entityId(note.getEntityId())
                .entityTitle(note.getEntityTitle())
                .isPinned(note.getIsPinned())
                .colorTag(note.getColorTag())
                .visibility(note.getVisibility())
                .tags(note.getTags())
                .authorId(note.getAuthorId())
                .authorName(note.getAuthorName())
                .authorRole(note.getAuthorRole())
                .authorEmail(note.getAuthorEmail())
                .createdAt(note.getCreatedAt())
                .updatedAt(note.getUpdatedAt())
                .build();
    }
}
