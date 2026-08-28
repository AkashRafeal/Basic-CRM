package com.crm.activity.controller;

import com.crm.activity.common.ApiResponse;
import com.crm.activity.dto.CreateNoteRequest;
import com.crm.activity.dto.NoteResponse;
import com.crm.activity.dto.UpdateNoteRequest;
import com.crm.activity.model.EntityType;
import com.crm.activity.security.UserPrincipal;
import com.crm.activity.service.NoteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
@Tag(name = "Notes Management", description = "Endpoints for rich note-taking, pinning, tagging, and polymorphic entity linking")
public class NoteController {

    private final NoteService noteService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create Note", description = "Create a note attached to a Lead, Customer, Deal, Contact, Product, or general workspace")
    public ResponseEntity<ApiResponse<NoteResponse>> createNote(
            @Valid @RequestBody CreateNoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        NoteResponse response = noteService.createNote(request, principal);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Note created successfully", response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Notes", description = "Filter notes by entity, pinned status, search term with privacy scoping")
    public ResponseEntity<ApiResponse<List<NoteResponse>>> getNotes(
            @RequestParam(required = false) EntityType entityType,
            @RequestParam(required = false) Long entityId,
            @RequestParam(required = false) Boolean pinnedOnly,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<NoteResponse> notes = noteService.getNotes(entityType, entityId, pinnedOnly, search, principal);
        return ResponseEntity.ok(ApiResponse.ok("Notes retrieved successfully", notes));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get Note by ID", description = "Fetch single note details with privacy verification")
    public ResponseEntity<ApiResponse<NoteResponse>> getNoteById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        NoteResponse response = noteService.getNoteById(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Note retrieved successfully", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update Note", description = "Update note title, content, color, visibility or tags (Author or Admin only)")
    public ResponseEntity<ApiResponse<NoteResponse>> updateNote(
            @PathVariable Long id,
            @Valid @RequestBody UpdateNoteRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        NoteResponse response = noteService.updateNote(id, request, principal);
        return ResponseEntity.ok(ApiResponse.ok("Note updated successfully", response));
    }

    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Toggle Note Pin Status", description = "Pin or unpin a note to top of feed/record")
    public ResponseEntity<ApiResponse<NoteResponse>> togglePin(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        NoteResponse response = noteService.togglePin(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Note pin status updated", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Delete Note", description = "Delete note (Author or Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteNote(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        noteService.deleteNote(id, principal);
        return ResponseEntity.ok(ApiResponse.ok("Note deleted successfully", null));
    }
}
