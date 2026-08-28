package com.crm.appointment.dto;

import com.crm.appointment.model.AppointmentStatus;
import com.crm.appointment.model.EntityType;
import com.crm.appointment.model.MeetingMode;
import com.crm.appointment.model.MeetingType;
import jakarta.validation.constraints.Email;
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
public class UpdateAppointmentRequest {

    private String title;

    private String description;

    private MeetingType meetingType;

    private AppointmentStatus status;

    private MeetingMode meetingMode;

    private String meetingLink;

    private String location;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Integer durationMinutes;

    private String timeZone;

    private EntityType entityType;

    private Long entityId;

    private String entityTitle;

    private String attendeeName;

    @Email(message = "Invalid attendee email format")
    private String attendeeEmail;

    @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits")
    private String attendeePhone;

    private String externalGuests;

    private String outcomeNotes;

    private String actionItems;

    private String cancellationReason;

    private String recordingUrl;

    private Long organizerId;

    private String organizerName;
}
