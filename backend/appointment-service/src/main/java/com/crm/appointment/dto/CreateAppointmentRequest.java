package com.crm.appointment.dto;

import com.crm.appointment.model.EntityType;
import com.crm.appointment.model.MeetingMode;
import com.crm.appointment.model.MeetingType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAppointmentRequest {

    @NotBlank(message = "Meeting title is required")
    private String title;

    private String description;

    @NotNull(message = "Meeting type is required")
    private MeetingType meetingType;

    @NotNull(message = "Meeting mode is required")
    private MeetingMode meetingMode;

    private String meetingLink;

    private String location;

    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer durationMinutes;

    private String timeZone;

    private EntityType entityType;

    private Long entityId;

    private String entityTitle;

    private Long organizerId; // Optional if assigned to another rep by Admin/Manager

    @NotBlank(message = "Attendee name is required")
    private String attendeeName;

    @NotBlank(message = "Attendee email is required")
    @Email(message = "Invalid attendee email format")
    private String attendeeEmail;

    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String attendeePhone;

    private String externalGuests;
}
