package com.crm.contact.controller;

import com.crm.contact.dto.*;
import com.crm.contact.model.ContactStatus;
import com.crm.contact.model.ContactType;
import com.crm.contact.model.StakeholderTag;
import com.crm.contact.security.UserPrincipal;
import com.crm.contact.service.ContactService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/contacts")
@RequiredArgsConstructor
@Tag(name = "Contact Management", description = "APIs for managing contacts, stakeholder matrix, custom tags, and coverage")
public class ContactController {

    private final ContactService contactService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get all contacts with search and filters")
    public ResponseEntity<Map<String, Object>> getContacts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long assignedId,
            @RequestParam(required = false) ContactType contactType,
            @RequestParam(required = false) ContactStatus status,
            @RequestParam(required = false) Boolean isPrimary,
            @RequestParam(required = false) Boolean isArchived,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Page<ContactResponse> contactPage = contactService.getContacts(
                search, customerId, assignedId, contactType, status, isPrimary, isArchived, PageRequest.of(page, size, sort)
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", contactPage.getContent());
        response.put("currentPage", contactPage.getNumber());
        response.put("totalItems", contactPage.getTotalElements());
        response.put("totalPages", contactPage.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get contact details by ID")
    public ResponseEntity<Map<String, Object>> getContactById(@PathVariable Long id) {
        ContactResponse res = contactService.getContactById(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", res);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get all contacts associated with a customer account")
    public ResponseEntity<Map<String, Object>> getContactsByCustomer(@PathVariable Long customerId) {
        List<ContactResponse> list = contactService.getContactsByCustomer(customerId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", list);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Get contact metrics and stakeholder KPIs")
    public ResponseEntity<Map<String, Object>> getContactStats() {
        ContactStatsResponse stats = contactService.getContactStats();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", stats);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Create a new contact")
    public ResponseEntity<Map<String, Object>> createContact(
            @Valid @RequestBody CreateContactRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Long effectiveUserId = principal != null ? principal.getId() : userId;
        String effectiveUserName = principal != null ? principal.getName() : (userName != null ? userName : "User");
        String effectiveUserRole = principal != null ? principal.getRole() : (userRole != null ? userRole : "ROLE_EMPLOYEE");

        ContactResponse created = contactService.createContact(req, effectiveUserId, effectiveUserName, effectiveUserRole);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contact created successfully");
        response.put("data", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Update an existing contact")
    public ResponseEntity<Map<String, Object>> updateContact(
            @PathVariable Long id,
            @Valid @RequestBody UpdateContactRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Long effectiveUserId = principal != null ? principal.getId() : userId;
        String effectiveUserName = principal != null ? principal.getName() : (userName != null ? userName : "User");
        String effectiveUserRole = principal != null ? principal.getRole() : (userRole != null ? userRole : "ROLE_EMPLOYEE");

        ContactResponse updated = contactService.updateContact(id, req, effectiveUserId, effectiveUserName, effectiveUserRole);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contact updated successfully");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/relink")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Re-link contact to another customer account / lead")
    public ResponseEntity<Map<String, Object>> relinkContact(
            @PathVariable Long id,
            @Valid @RequestBody RelinkContactRequest req,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Long effectiveUserId = principal != null ? principal.getId() : userId;
        String effectiveUserName = principal != null ? principal.getName() : (userName != null ? userName : "User");
        String effectiveUserRole = principal != null ? principal.getRole() : (userRole != null ? userRole : "ROLE_EMPLOYEE");

        ContactResponse updated = contactService.relinkContact(
                id, req.getCustomerId(), req.getCustomerName(), effectiveUserId, effectiveUserName, effectiveUserRole
        );
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contact re-linked successfully");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/primary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "Toggle primary contact status for an account")
    public ResponseEntity<Map<String, Object>> togglePrimary(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") Boolean isPrimary
    ) {
        ContactResponse updated = contactService.togglePrimaryContact(id, isPrimary);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Primary contact status updated");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Archive contact (Admin & Manager only)")
    public ResponseEntity<Map<String, Object>> archiveContact(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestHeader(value = "X-User-Id", required = false) Long userId,
            @RequestHeader(value = "X-User-Name", required = false) String userName,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Long effectiveUserId = principal != null ? principal.getId() : userId;
        String effectiveUserName = principal != null ? principal.getName() : (userName != null ? userName : "Authorized User");
        String effectiveUserRole = principal != null ? principal.getRole() : (userRole != null ? userRole : "ROLE_MANAGER");

        ContactResponse updated = contactService.archiveContact(id, effectiveUserId, effectiveUserName, effectiveUserRole);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contact archived successfully");
        response.put("data", updated);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Restore an archived contact (Admin only)")
    public ResponseEntity<Map<String, Object>> restoreContact(@PathVariable Long id) {
        ContactResponse restored = contactService.restoreContact(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contact restored successfully");
        response.put("data", restored);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Permanently delete contact (Admin only)")
    public ResponseEntity<Map<String, Object>> permanentDeleteContact(@PathVariable Long id) {
        contactService.permanentDeleteContact(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contact permanently deleted");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/merge")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Merge duplicate contacts (Admin only)")
    public ResponseEntity<Map<String, Object>> mergeContacts(@Valid @RequestBody MergeContactRequest req) {
        ContactResponse merged = contactService.mergeContacts(req.getPrimaryContactId(), req.getDuplicateContactId());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Contacts merged successfully");
        response.put("data", merged);
        return ResponseEntity.ok(response);
    }

    // Stakeholder Custom Tags API
    @GetMapping("/tags")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'EMPLOYEE')")
    @Operation(summary = "List all custom stakeholder tags")
    public ResponseEntity<Map<String, Object>> getAllTags() {
        List<StakeholderTag> tags = contactService.getAllTags();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", tags);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/tags")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a custom stakeholder tag (Admin only)")
    public ResponseEntity<Map<String, Object>> createTag(@Valid @RequestBody CreateTagRequest req) {
        StakeholderTag created = contactService.createTag(req.getName(), req.getColor(), req.getDescription());
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Stakeholder tag created successfully");
        response.put("data", created);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @DeleteMapping("/tags/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a custom stakeholder tag (Admin only)")
    public ResponseEntity<Map<String, Object>> deleteTag(@PathVariable Long id) {
        contactService.deleteTag(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Stakeholder tag deleted");
        return ResponseEntity.ok(response);
    }
}
