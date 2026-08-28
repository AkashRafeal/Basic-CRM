package com.crm.contact.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "crm_contacts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String firstName;

    @Column(nullable = false, length = 100)
    private String lastName;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(length = 30)
    private String phone;

    @Column(length = 30)
    private String mobile;

    @Column(length = 150)
    private String jobTitle;

    @Column(length = 100)
    private String department;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(length = 200)
    private String customerName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ContactType contactType = ContactType.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ContactStatus status = ContactStatus.ACTIVE;

    @Builder.Default
    private Boolean isPrimaryContact = false;

    @Builder.Default
    private Boolean doNotCall = false;

    @Builder.Default
    private Boolean doNotEmail = false;

    @Column(length = 255)
    private String address;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String state;

    @Column(length = 100)
    private String country;

    @Column(length = 20)
    private String postalCode;

    @Column(length = 255)
    private String linkedinUrl;

    @Column(length = 255)
    private String twitterHandle;

    private Long assignedToUserId;

    @Column(length = 150)
    private String assignedToUserName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDate lastContactedDate;

    @Column(length = 255)
    private String tags;

    @Builder.Default
    @Column(name = "is_archived")
    private Boolean isArchived = false;

    private LocalDateTime archivedAt;

    private Long archivedByUserId;

    @Column(length = 120)
    private String archivedByUserName;

    private Long createdByUserId;

    @Column(length = 120)
    private String createdByUserName;

    @Column(length = 50)
    private String createdByRole;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    public String getFullName() {
        return (firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "").trim();
    }
}
