package com.crm.activity.service;

import com.crm.activity.dto.CreateNoteRequest;
import com.crm.activity.dto.NoteResponse;
import com.crm.activity.dto.UpdateNoteRequest;
import com.crm.activity.model.*;
import com.crm.activity.repository.NoteRepository;
import com.crm.activity.security.UserPrincipal;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NoteService {

    private final NoteRepository noteRepository;
    private final ActivityLogService activityLogService;

    @Transactional
    public NoteResponse createNote(CreateNoteRequest request, UserPrincipal principal) {
        Long authorId = principal != null && principal.getId() != null ? principal.getId() : 1L;
        String authorName = principal != null && principal.getName() != null ? principal.getName() : "System User";
        String authorRole = principal != null && principal.getRole() != null ? principal.getRole() : "ROLE_ADMIN";
        String authorEmail = principal != null ? principal.getEmail() : null;
        Long authorDeptId = principal != null ? principal.getDepartmentId() : null;

        Note note = Note.builder()
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .entityType(request.getEntityType())
                .entityId(request.getEntityId())
                .entityTitle(request.getEntityTitle())
                .isPinned(Boolean.TRUE.equals(request.getIsPinned()))
                .colorTag(request.getColorTag() != null ? request.getColorTag() : "blue")
                .visibility(request.getVisibility() != null ? request.getVisibility() : NoteVisibility.PUBLIC_TEAM)
                .tags(request.getTags())
                .authorId(authorId)
                .authorName(authorName)
                .authorRole(authorRole)
                .authorEmail(authorEmail)
                .authorDepartmentId(authorDeptId)
                .build();

        Note saved = noteRepository.save(note);
        log.info("Created Note ID: {} ('{}') attached to {}:{} by {} (Role: {}, Dept: {})",
                saved.getId(), saved.getTitle(), saved.getEntityType(), saved.getEntityId(), saved.getAuthorName(), saved.getAuthorRole(), saved.getAuthorDepartmentId());

        // Automatically log activity
        try {
            activityLogService.logInternalActivity(
                    ActivityType.NOTE_CREATED,
                    "Note Added: " + saved.getTitle(),
                    "Added note attached to " + saved.getEntityType() + " " + (saved.getEntityTitle() != null ? saved.getEntityTitle() : ""),
                    saved.getEntityType(),
                    saved.getEntityId(),
                    saved.getEntityTitle(),
                    principal
            );
        } catch (Exception e) {
            log.warn("Could not log activity for note creation: {}", e.getMessage());
        }

        return NoteResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<NoteResponse> getNotes(EntityType entityType, Long entityId, Boolean pinnedOnly, String search, UserPrincipal principal) {
        Specification<Note> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (entityType != null) {
                predicates.add(cb.equal(root.get("entityType"), entityType));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("entityId"), entityId));
            }
            if (Boolean.TRUE.equals(pinnedOnly)) {
                predicates.add(cb.isTrue(root.get("isPinned")));
            }
            if (search != null && !search.isBlank()) {
                String term = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term);
                Predicate contentMatch = cb.like(cb.lower(root.get("content")), term);
                Predicate tagsMatch = cb.like(cb.lower(root.get("tags")), term);
                Predicate entityTitleMatch = cb.like(cb.lower(root.get("entityTitle")), term);
                predicates.add(cb.or(titleMatch, contentMatch, tagsMatch, entityTitleMatch));
            }

            // Role-Based Access Scoping:
            // Admin: All notes across the CRM
            // Manager: Team notes (matching departmentId) & own notes
            // Employee: Own assigned entities & authored notes
            if (principal != null && !principal.isAdmin()) {
                if (principal.isManager()) {
                    if (principal.getDepartmentId() != null) {
                        Predicate deptMatch = cb.equal(root.get("authorDepartmentId"), principal.getDepartmentId());
                        Predicate authorMatch = cb.equal(root.get("authorId"), principal.getId());
                        predicates.add(cb.or(deptMatch, authorMatch));
                    } else {
                        predicates.add(cb.equal(root.get("authorId"), principal.getId()));
                    }
                } else {
                    // Employee sees own notes
                    predicates.add(cb.equal(root.get("authorId"), principal.getId()));
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by(Sort.Order.desc("isPinned"), Sort.Order.desc("createdAt"));
        return noteRepository.findAll(spec, sort)
                .stream()
                .map(NoteResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public NoteResponse getNoteById(Long id, UserPrincipal principal) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found with ID: " + id));

        // Privacy & Scope verification:
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = note.getAuthorId().equals(principal.getId());
                boolean isTeam = principal.getDepartmentId() != null && principal.getDepartmentId().equals(note.getAuthorDepartmentId());
                if (!isOwn && !isTeam) {
                    throw new AccessDeniedException("Access denied: You can only view notes within your department team");
                }
            } else {
                if (!note.getAuthorId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: You can only view your own notes and assigned portfolios");
                }
            }
        }

        return NoteResponse.fromEntity(note);
    }

    @Transactional
    public NoteResponse updateNote(Long id, UpdateNoteRequest request, UserPrincipal principal) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found with ID: " + id));

        // Edit Permissions:
        // Admin: Any note
        // Manager: Team notes & own notes
        // Employee: Own notes only
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = note.getAuthorId().equals(principal.getId());
                boolean isTeam = principal.getDepartmentId() != null && principal.getDepartmentId().equals(note.getAuthorDepartmentId());
                if (!isOwn && !isTeam) {
                    throw new AccessDeniedException("Access denied: Managers can only edit notes within their team portfolio");
                }
            } else {
                if (!note.getAuthorId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: Sales Representatives can only edit their own notes");
                }
            }
        }

        note.setTitle(request.getTitle().trim());
        note.setContent(request.getContent().trim());
        if (request.getIsPinned() != null) note.setIsPinned(request.getIsPinned());
        if (request.getColorTag() != null) note.setColorTag(request.getColorTag());
        if (request.getVisibility() != null) note.setVisibility(request.getVisibility());
        if (request.getTags() != null) note.setTags(request.getTags());

        Note updated = noteRepository.save(note);
        log.info("Updated Note ID: {} by user {}", updated.getId(), principal != null ? principal.getName() : "Unknown");

        try {
            activityLogService.logInternalActivity(
                    ActivityType.NOTE_UPDATED,
                    "Note Updated: " + updated.getTitle(),
                    "Note content or attributes updated.",
                    updated.getEntityType(),
                    updated.getEntityId(),
                    updated.getEntityTitle(),
                    principal
            );
        } catch (Exception e) {
            log.warn("Could not log activity for note update: {}", e.getMessage());
        }

        return NoteResponse.fromEntity(updated);
    }

    @Transactional
    public NoteResponse togglePin(Long id, UserPrincipal principal) {
        Note note = noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found with ID: " + id));

        // Pin Permissions:
        // Admin: Organization-wide
        // Manager: Team notes & own notes
        // Employee: Own notes only
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = note.getAuthorId().equals(principal.getId());
                boolean isTeam = principal.getDepartmentId() != null && principal.getDepartmentId().equals(note.getAuthorDepartmentId());
                if (!isOwn && !isTeam) {
                    throw new AccessDeniedException("Access denied: Managers can only pin/unpin notes within their department team");
                }
            } else {
                if (!note.getAuthorId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: Representatives can only pin/unpin their own notes");
                }
            }
        }

        note.setIsPinned(!Boolean.TRUE.equals(note.getIsPinned()));
        Note saved = noteRepository.save(note);
        log.info("Toggled pin status for Note ID {} to {} by {}", id, saved.getIsPinned(), principal != null ? principal.getName() : "System");
        return NoteResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteNote(Long id, UserPrincipal principal) {
        noteRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Note not found with ID: " + id));

        // Compliance Policy Enforcement:
        // Admin: Full permission
        // Manager: ❌ No (Preserve compliance trail)
        // Employee: ❌ No (Immutable interaction log)
        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                throw new AccessDeniedException("Compliance policy: Note deletion is restricted strictly to Administrators to preserve audit and compliance trail");
            } else {
                throw new AccessDeniedException("Compliance policy: Interaction notes cannot be deleted by Sales Representatives to preserve audit trail");
            }
        }

        noteRepository.deleteById(id);
        log.info("Permanently deleted Note ID: {} by Administrator {}", id, principal != null ? principal.getName() : "Admin");
    }
}
