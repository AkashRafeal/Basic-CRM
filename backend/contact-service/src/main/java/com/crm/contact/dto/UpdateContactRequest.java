package com.crm.contact.dto;

import com.crm.contact.model.ContactStatus;
import com.crm.contact.model.ContactType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateContactRequest {

    @NotBlank(message = "First name is required")
    private String firstName;

    @NotBlank(message = "Last name is required")
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
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
    private String tags;
    private LocalDate lastContactedDate;
}
