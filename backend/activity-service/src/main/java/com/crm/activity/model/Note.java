package com.crm.activity.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notes", indexes = {
    @Index(name = "idx_note_entity", columnList = "entity_type, entity_id"),
    @Index(name = "idx_note_author", columnList = "author_id"),
    @Index(name = "idx_note_pinned", columnList = "is_pinned")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Note {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 50)
    private EntityType entityType;

    @Column(name = "entity_id")
    private Long entityId;

    @Column(name = "entity_title", length = 255)
    private String entityTitle;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "color_tag", length = 50)
    @Builder.Default
    private String colorTag = "blue"; // blue, green, purple, amber, rose, indigo

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private NoteVisibility visibility = NoteVisibility.PUBLIC_TEAM;

    @Column(length = 500)
    private String tags; // Comma-separated tags e.g. "Decision,Urgent,Pricing"

    @Column(name = "author_id", nullable = false)
    private Long authorId;

    @Column(name = "author_name", nullable = false, length = 150)
    private String authorName;

    @Column(name = "author_role", length = 50)
    private String authorRole;

    @Column(name = "author_email", length = 150)
    private String authorEmail;

    @Column(name = "author_department_id")
    private Long authorDepartmentId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
