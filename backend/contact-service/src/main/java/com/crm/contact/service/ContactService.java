package com.crm.contact.service;

import com.crm.contact.dto.ContactResponse;
import com.crm.contact.dto.ContactStatsResponse;
import com.crm.contact.dto.CreateContactRequest;
import com.crm.contact.dto.UpdateContactRequest;
import com.crm.contact.model.Contact;
import com.crm.contact.model.ContactStatus;
import com.crm.contact.model.ContactType;
import com.crm.contact.model.StakeholderTag;
import com.crm.contact.repository.ContactRepository;
import com.crm.contact.repository.StakeholderTagRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final StakeholderTagRepository stakeholderTagRepository;

    @Transactional(readOnly = true)
    public Page<ContactResponse> getContacts(
            String search,
            Long customerId,
            Long assignedId,
            ContactType contactType,
            ContactStatus status,
            Boolean isPrimary,
            Boolean isArchived,
            Pageable pageable
    ) {
        boolean archived = Boolean.TRUE.equals(isArchived);
        return contactRepository.searchContacts(search, customerId, assignedId, contactType, status, isPrimary, archived, pageable)
                .map(ContactResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ContactResponse getContactById(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found with ID: " + id));
        return ContactResponse.fromEntity(contact);
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> getContactsByCustomer(Long customerId) {
        return contactRepository.findByCustomerIdAndIsArchivedFalseOrderByIsPrimaryContactDescLastNameAsc(customerId)
                .stream()
                .map(ContactResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public ContactResponse createContact(CreateContactRequest req, Long userId, String userName, String userRole) {
        if (Boolean.TRUE.equals(req.getIsPrimaryContact()) && req.getCustomerId() != null) {
            unsetOtherPrimaryContacts(req.getCustomerId(), null);
        }

        Long assignedId = req.getAssignedToUserId();
        String assignedName = req.getAssignedToUserName();

        // For Employee, default assigned to self if not set
        if ("ROLE_EMPLOYEE".equalsIgnoreCase(userRole) && assignedId == null) {
            assignedId = userId;
            assignedName = userName;
        }

        boolean isPrimary = Boolean.TRUE.equals(req.getIsPrimaryContact()) ||
                (req.getTags() != null && (req.getTags().toLowerCase().contains("primary lead") || req.getTags().toLowerCase().contains("primary contact")));

        if (isPrimary && req.getCustomerId() != null) {
            unsetOtherPrimaryContacts(req.getCustomerId(), null);
        }

        Contact contact = Contact.builder()
                .firstName(req.getFirstName().trim())
                .lastName(req.getLastName().trim())
                .email(req.getEmail().trim().toLowerCase())
                .phone(validateAndCleanPhone(req.getPhone()))
                .mobile(validateAndCleanPhone(req.getMobile()))
                .jobTitle(req.getJobTitle())
                .department(req.getDepartment())
                .customerId(req.getCustomerId())
                .customerName(req.getCustomerName())
                .contactType(req.getContactType() != null ? req.getContactType() : ContactType.OTHER)
                .status(req.getStatus() != null ? req.getStatus() : ContactStatus.ACTIVE)
                .isPrimaryContact(isPrimary)
                .doNotCall(Boolean.TRUE.equals(req.getDoNotCall()))
                .doNotEmail(Boolean.TRUE.equals(req.getDoNotEmail()))
                .address(req.getAddress())
                .city(req.getCity())
                .state(req.getState())
                .country(req.getCountry() != null ? req.getCountry() : "India")
                .postalCode(req.getPostalCode())
                .linkedinUrl(req.getLinkedinUrl())
                .twitterHandle(req.getTwitterHandle())
                .assignedToUserId(assignedId)
                .assignedToUserName(assignedName)
                .tags(req.getTags())
                .notes(req.getNotes())
                .lastContactedDate(req.getLastContactedDate())
                .isArchived(false)
                .createdByUserId(userId)
                .createdByUserName(userName)
                .createdByRole(userRole)
                .build();

        Contact saved = contactRepository.save(contact);
        log.info("Created contact ID: {} - {} by user {} ({})", saved.getId(), saved.getFullName(), userName, userRole);
        return ContactResponse.fromEntity(saved);
    }

    @Transactional
    public ContactResponse updateContact(Long id, UpdateContactRequest req, Long userId, String userName, String userRole) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found with ID: " + id));

        // RBAC Check for Employee: Can only edit their own contacts
        if ("ROLE_EMPLOYEE".equalsIgnoreCase(userRole)) {
            if (contact.getAssignedToUserId() != null && !contact.getAssignedToUserId().equals(userId)) {
                throw new IllegalArgumentException("Employees can only edit contacts assigned to their accounts.");
            }
        }

        boolean isPrimary = Boolean.TRUE.equals(req.getIsPrimaryContact()) ||
                (req.getTags() != null && (req.getTags().toLowerCase().contains("primary lead") || req.getTags().toLowerCase().contains("primary contact")));

        if (isPrimary && req.getCustomerId() != null) {
            unsetOtherPrimaryContacts(req.getCustomerId(), id);
        }

        contact.setFirstName(req.getFirstName().trim());
        contact.setLastName(req.getLastName().trim());
        contact.setEmail(req.getEmail().trim().toLowerCase());
        contact.setPhone(validateAndCleanPhone(req.getPhone()));
        contact.setMobile(validateAndCleanPhone(req.getMobile()));
        contact.setJobTitle(req.getJobTitle());
        contact.setDepartment(req.getDepartment());
        contact.setCustomerId(req.getCustomerId());
        contact.setCustomerName(req.getCustomerName());
        if (req.getContactType() != null) contact.setContactType(req.getContactType());
        if (req.getStatus() != null) contact.setStatus(req.getStatus());
        contact.setIsPrimaryContact(isPrimary);
        if (req.getDoNotCall() != null) contact.setDoNotCall(req.getDoNotCall());
        if (req.getDoNotEmail() != null) contact.setDoNotEmail(req.getDoNotEmail());
        contact.setAddress(req.getAddress());
        contact.setCity(req.getCity());
        contact.setState(req.getState());
        contact.setCountry(req.getCountry());
        contact.setPostalCode(req.getPostalCode());
        contact.setLinkedinUrl(req.getLinkedinUrl());
        contact.setTwitterHandle(req.getTwitterHandle());
        if (req.getTags() != null) contact.setTags(req.getTags());

        // For Employee, don't allow reassigning to others
        if (!"ROLE_EMPLOYEE".equalsIgnoreCase(userRole)) {
            contact.setAssignedToUserId(req.getAssignedToUserId());
            contact.setAssignedToUserName(req.getAssignedToUserName());
        }

        contact.setNotes(req.getNotes());
        contact.setLastContactedDate(req.getLastContactedDate());

        Contact saved = contactRepository.save(contact);
        log.info("Updated contact ID: {} by user {} ({})", saved.getId(), userName, userRole);
        return ContactResponse.fromEntity(saved);
    }

    @Transactional
    public ContactResponse relinkContact(Long contactId, Long newCustomerId, String newCustomerName, Long userId, String userName, String userRole) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found with ID: " + contactId));

        if ("ROLE_EMPLOYEE".equalsIgnoreCase(userRole)) {
            if (contact.getAssignedToUserId() != null && !contact.getAssignedToUserId().equals(userId)) {
                throw new IllegalArgumentException("Employees can only re-link contacts assigned to their accounts.");
            }
        }

        contact.setCustomerId(newCustomerId);
        contact.setCustomerName(newCustomerName);
        Contact saved = contactRepository.save(contact);
        log.info("Re-linked contact ID: {} to customer ID: {} ({}) by {}", contactId, newCustomerId, newCustomerName, userName);
        return ContactResponse.fromEntity(saved);
    }

    @Transactional
    public ContactResponse archiveContact(Long id, Long userId, String userName, String userRole) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found with ID: " + id));

        contact.setIsArchived(true);
        contact.setArchivedAt(LocalDateTime.now());
        contact.setArchivedByUserId(userId);
        contact.setArchivedByUserName(userName);

        Contact saved = contactRepository.save(contact);
        log.info("Archived contact ID: {} by {} ({})", id, userName, userRole);
        return ContactResponse.fromEntity(saved);
    }

    @Transactional
    public ContactResponse restoreContact(Long id) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found with ID: " + id));

        contact.setIsArchived(false);
        contact.setArchivedAt(null);
        contact.setArchivedByUserId(null);
        contact.setArchivedByUserName(null);

        Contact saved = contactRepository.save(contact);
        log.info("Restored contact ID: {}", id);
        return ContactResponse.fromEntity(saved);
    }

    @Transactional
    public void permanentDeleteContact(Long id) {
        if (!contactRepository.existsById(id)) {
            throw new RuntimeException("Contact not found with ID: " + id);
        }
        contactRepository.deleteById(id);
        log.info("Permanently deleted contact ID: {}", id);
    }

    @Transactional
    public ContactResponse mergeContacts(Long primaryContactId, Long duplicateContactId) {
        Contact primary = contactRepository.findById(primaryContactId)
                .orElseThrow(() -> new RuntimeException("Primary contact not found: " + primaryContactId));
        Contact duplicate = contactRepository.findById(duplicateContactId)
                .orElseThrow(() -> new RuntimeException("Duplicate contact not found: " + duplicateContactId));

        if (primary.getPhone() == null && duplicate.getPhone() != null) primary.setPhone(duplicate.getPhone());
        if (primary.getMobile() == null && duplicate.getMobile() != null) primary.setMobile(duplicate.getMobile());
        if (primary.getJobTitle() == null && duplicate.getJobTitle() != null) primary.setJobTitle(duplicate.getJobTitle());
        if (primary.getLinkedinUrl() == null && duplicate.getLinkedinUrl() != null) primary.setLinkedinUrl(duplicate.getLinkedinUrl());
        if (primary.getNotes() == null) primary.setNotes(duplicate.getNotes());
        else if (duplicate.getNotes() != null) primary.setNotes(primary.getNotes() + "\n[Merged Notes]: " + duplicate.getNotes());

        Contact saved = contactRepository.save(primary);
        contactRepository.delete(duplicate);
        log.info("Merged duplicate contact {} into primary contact {}", duplicateContactId, primaryContactId);
        return ContactResponse.fromEntity(saved);
    }

    private String validateAndCleanPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }
        String clean = phone.trim().replaceAll("[\\s\\-\\(\\)\\+]", "");
        if (clean.startsWith("91") && clean.length() == 12) {
            clean = clean.substring(2);
        }
        if (!clean.matches("^\\d{10}$")) {
            throw new IllegalArgumentException("Phone number must be exactly 10 digits (e.g. 9876543210).");
        }
        return clean;
    }

    @Transactional
    public ContactResponse togglePrimaryContact(Long id, Boolean isPrimary) {
        Contact contact = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found with ID: " + id));

        if (Boolean.TRUE.equals(isPrimary) && contact.getCustomerId() != null) {
            unsetOtherPrimaryContacts(contact.getCustomerId(), id);
        }

        contact.setIsPrimaryContact(isPrimary);

        String tags = contact.getTags();
        if (Boolean.TRUE.equals(isPrimary)) {
            if (tags == null || tags.trim().isEmpty()) {
                contact.setTags("Primary Lead");
            } else if (!tags.toLowerCase().contains("primary lead")) {
                contact.setTags(tags + ", Primary Lead");
            }
        } else {
            if (tags != null) {
                String cleaned = java.util.Arrays.stream(tags.split(","))
                        .map(String::trim)
                        .filter(t -> !t.equalsIgnoreCase("primary lead") && !t.equalsIgnoreCase("primary contact"))
                        .collect(Collectors.joining(", "));
                contact.setTags(cleaned.isEmpty() ? null : cleaned);
            }
        }

        Contact saved = contactRepository.save(contact);
        log.info("Toggled primary contact ID: {} to {}", id, isPrimary);
        return ContactResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public ContactStatsResponse getContactStats() {
        long total = contactRepository.countByIsArchivedFalse();
        long archived = contactRepository.countByIsArchivedTrue();
        long active = contactRepository.countByStatusAndIsArchivedFalse(ContactStatus.ACTIVE);
        long primary = contactRepository.countPrimaryContacts();
        long decisionMakers = contactRepository.countDecisionMakers();
        long champions = contactRepository.countChampions();
        long accountsCovered = contactRepository.countDistinctCustomerIds();

        Map<String, Long> byType = new HashMap<>();
        for (Object[] row : contactRepository.countByContactTypeGroup()) {
            if (row[0] != null) {
                byType.put(row[0].toString(), (Long) row[1]);
            }
        }

        Map<String, Long> byStatus = new HashMap<>();
        for (Object[] row : contactRepository.countByStatusGroup()) {
            if (row[0] != null) {
                byStatus.put(row[0].toString(), (Long) row[1]);
            }
        }

        return ContactStatsResponse.builder()
                .totalContacts(total)
                .archivedContacts(archived)
                .activeContacts(active)
                .primaryContacts(primary)
                .decisionMakers(decisionMakers)
                .champions(champions)
                .accountsCovered(accountsCovered)
                .contactsByType(byType)
                .contactsByStatus(byStatus)
                .build();
    }

    // Stakeholder Custom Tags Management
    @Transactional(readOnly = true)
    public List<StakeholderTag> getAllTags() {
        return stakeholderTagRepository.findAll();
    }

    @Transactional
    public StakeholderTag createTag(String name, String color, String description) {
        if (stakeholderTagRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("A tag with name '" + name + "' already exists.");
        }
        StakeholderTag tag = StakeholderTag.builder()
                .name(name.trim())
                .color(color != null ? color.trim() : "indigo")
                .description(description != null ? description.trim() : null)
                .build();
        return stakeholderTagRepository.save(tag);
    }

    @Transactional
    public void deleteTag(Long id) {
        stakeholderTagRepository.deleteById(id);
    }

    private void unsetOtherPrimaryContacts(Long customerId, Long excludeContactId) {
        List<Contact> customerContacts = contactRepository.findByCustomerIdAndIsArchivedFalseOrderByIsPrimaryContactDescLastNameAsc(customerId);
        for (Contact c : customerContacts) {
            if (excludeContactId == null || !c.getId().equals(excludeContactId)) {
                if (Boolean.TRUE.equals(c.getIsPrimaryContact()) || (c.getTags() != null && c.getTags().toLowerCase().contains("primary"))) {
                    c.setIsPrimaryContact(false);
                    if (c.getTags() != null) {
                        String cleaned = java.util.Arrays.stream(c.getTags().split(","))
                                .map(String::trim)
                                .filter(t -> !t.equalsIgnoreCase("primary lead") && !t.equalsIgnoreCase("primary contact"))
                                .collect(Collectors.joining(", "));
                        c.setTags(cleaned.isEmpty() ? null : cleaned);
                    }
                    contactRepository.save(c);
                }
            }
        }
    }
}
