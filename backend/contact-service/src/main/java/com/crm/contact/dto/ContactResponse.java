package com.crm.contact.dto;

import com.crm.contact.model.Contact;
import com.crm.contact.model.ContactStatus;
import com.crm.contact.model.ContactType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {

    private Long id;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String mobile;
    private String jobTitle;
    private String department;
    private Long customerId;
    private String customerName;
    private ContactType contactType;
    private ContactStatus status;
    private Boolean isPrimaryContact;
    private Boolean doNotCall;
    private Boolean doNotEmail;
    private String address;
    private String city;
    private String state;
    private String country;
    private String postalCode;
    private String linkedinUrl;
    private String twitterHandle;
    private Long assignedToUserId;
    private String assignedToUserName;
    private String notes;
    private LocalDate lastContactedDate;
    private String tags;
    private Boolean isArchived;
    private LocalDateTime archivedAt;
    private Long archivedByUserId;
    private String archivedByUserName;
    private Long createdByUserId;
    private String createdByUserName;
    private String createdByRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ContactResponse fromEntity(Contact c) {
        if (c == null) return null;
        return ContactResponse.builder()
                .id(c.getId())
                .firstName(c.getFirstName())
                .lastName(c.getLastName())
                .fullName(c.getFullName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .mobile(c.getMobile())
                .jobTitle(c.getJobTitle())
                .department(c.getDepartment())
                .customerId(c.getCustomerId())
                .customerName(c.getCustomerName())
                .contactType(c.getContactType())
                .status(c.getStatus())
                .isPrimaryContact(c.getIsPrimaryContact())
                .doNotCall(c.getDoNotCall())
                .doNotEmail(c.getDoNotEmail())
                .address(c.getAddress())
                .city(c.getCity())
                .state(c.getState())
                .country(c.getCountry())
                .postalCode(c.getPostalCode())
                .linkedinUrl(c.getLinkedinUrl())
                .twitterHandle(c.getTwitterHandle())
                .assignedToUserId(c.getAssignedToUserId())
                .assignedToUserName(c.getAssignedToUserName())
                .notes(c.getNotes())
                .tags(c.getTags())
                .isArchived(c.getIsArchived())
                .archivedAt(c.getArchivedAt())
                .archivedByUserId(c.getArchivedByUserId())
                .archivedByUserName(c.getArchivedByUserName())
                .createdByUserId(c.getCreatedByUserId())
                .createdByUserName(c.getCreatedByUserName())
                .createdByRole(c.getCreatedByRole())
                .lastContactedDate(c.getLastContactedDate())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }
}
