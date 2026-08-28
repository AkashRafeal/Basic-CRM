package com.crm.appointment.service;

import com.crm.appointment.dto.AppointmentResponse;
import com.crm.appointment.dto.CreateAppointmentRequest;
import com.crm.appointment.dto.ImportResultResponse;
import com.crm.appointment.model.Appointment;
import com.crm.appointment.model.AppointmentStatus;
import com.crm.appointment.model.EntityType;
import com.crm.appointment.model.MeetingMode;
import com.crm.appointment.model.MeetingType;
import com.crm.appointment.repository.AppointmentRepository;
import com.crm.appointment.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.StringReader;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentDataExchangeService {

    private final AppointmentService appointmentService;
    private final AppointmentRepository appointmentRepository;

    private static final DateTimeFormatter ICS_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss");

    /**
     * Generate CSV export for appointments matching current filters & role scope
     */
    @Transactional(readOnly = true)
    public String exportAppointmentsCsv(
            EntityType entityType,
            Long entityId,
            AppointmentStatus status,
            MeetingType meetingType,
            MeetingMode meetingMode,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            UserPrincipal principal
    ) {
        Page<AppointmentResponse> page = appointmentService.getAppointments(
                entityType, entityId, status, meetingType, meetingMode, startDate, endDate, search, 0, 5000, principal
        );

        List<AppointmentResponse> list = page.getContent();
        StringBuilder sb = new StringBuilder();

        // Header Row
        sb.append("ID,Title,Meeting Type,Status,Meeting Mode,Start Time,End Time,Duration (Mins),Host Name,Host Email,Host Role,Attendee Name,Attendee Email,Attendee Phone,Meeting Link,Location,Entity Type,Entity Title,Outcome Notes,Action Items\n");

        for (AppointmentResponse a : list) {
            sb.append(escapeCsv(String.valueOf(a.getId()))).append(",");
            sb.append(escapeCsv(a.getTitle())).append(",");
            sb.append(escapeCsv(a.getMeetingType() != null ? a.getMeetingType().name() : "")).append(",");
            sb.append(escapeCsv(a.getStatus() != null ? a.getStatus().name() : "")).append(",");
            sb.append(escapeCsv(a.getMeetingMode() != null ? a.getMeetingMode().name() : "")).append(",");
            sb.append(escapeCsv(a.getStartTime() != null ? a.getStartTime().toString() : "")).append(",");
            sb.append(escapeCsv(a.getEndTime() != null ? a.getEndTime().toString() : "")).append(",");
            sb.append(escapeCsv(String.valueOf(a.getDurationMinutes()))).append(",");
            sb.append(escapeCsv(a.getOrganizerName())).append(",");
            sb.append(escapeCsv(a.getOrganizerEmail())).append(",");
            sb.append(escapeCsv(a.getOrganizerRole())).append(",");
            sb.append(escapeCsv(a.getAttendeeName())).append(",");
            sb.append(escapeCsv(a.getAttendeeEmail())).append(",");
            sb.append(escapeCsv(a.getAttendeePhone())).append(",");
            sb.append(escapeCsv(a.getMeetingLink())).append(",");
            sb.append(escapeCsv(a.getLocation())).append(",");
            sb.append(escapeCsv(a.getEntityType() != null ? a.getEntityType().name() : "")).append(",");
            sb.append(escapeCsv(a.getEntityTitle())).append(",");
            sb.append(escapeCsv(a.getOutcomeNotes())).append(",");
            sb.append(escapeCsv(a.getActionItems())).append("\n");
        }

        return sb.toString();
    }

    /**
     * Generate standard RFC 5545 iCalendar (.ics) feed
     */
    @Transactional(readOnly = true)
    public String exportAppointmentsIcs(
            EntityType entityType,
            Long entityId,
            AppointmentStatus status,
            MeetingType meetingType,
            MeetingMode meetingMode,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            UserPrincipal principal
    ) {
        Page<AppointmentResponse> page = appointmentService.getAppointments(
                entityType, entityId, status, meetingType, meetingMode, startDate, endDate, search, 0, 5000, principal
        );

        return buildIcsCalendar(page.getContent());
    }

    /**
     * Generate single appointment .ics calendar invite
     */
    @Transactional(readOnly = true)
    public String exportSingleAppointmentIcs(Long id, UserPrincipal principal) {
        Appointment appt = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        if (principal != null && !principal.isAdmin()) {
            if (principal.isManager()) {
                boolean isOwn = appt.getOrganizerId().equals(principal.getId());
                boolean isDept = principal.getDepartmentId() != null && principal.getDepartmentId().equals(appt.getOrganizerDepartmentId());
                if (!isOwn && !isDept) {
                    throw new AccessDeniedException("Access denied: You can only export your department appointments");
                }
            } else {
                if (!appt.getOrganizerId().equals(principal.getId())) {
                    throw new AccessDeniedException("Access denied: You can only export your own meetings");
                }
            }
        }

        return buildIcsCalendar(List.of(AppointmentResponse.fromEntity(appt)));
    }

    /**
     * Sample CSV Template for bulk imports
     */
    public String getCsvImportTemplate() {
        LocalDateTime tomorrowNoon = LocalDateTime.now().plusDays(1).withHour(14).withMinute(0).withSecond(0).withNano(0);
        String formattedStart = tomorrowNoon.format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm"));

        return "Title,Meeting Type,Meeting Mode,Start Time (YYYY-MM-DDTHH:mm),Duration (Mins),Attendee Name,Attendee Email,Attendee Phone (10-digit),Location / Virtual URL,Agenda Description,Entity Type,Entity Title\n" +
                "Cloud Architecture Demo & Commercials,PRODUCT_DEMO,VIRTUAL_GOOGLE_MEET," + formattedStart + ",45,Rajesh Sharma,rajesh@reliance.com,9876543210,Google Meet Auto,Review enterprise SLA and pricing in INR,DEAL,Reliance Enterprise Deal\n" +
                "Quarterly Business Review,ACCOUNT_REVIEW,IN_PERSON_OFFICE," + formattedStart + ",60,Anita Desai,anita@tata.com,9123456789,Bangalore HQ Level 4,Strategic vendor discussion,CUSTOMER,Tata Sons Account\n";
    }

    /**
     * Bulk Import Appointments from CSV
     */
    public ImportResultResponse importAppointmentsFromCsv(String csvContent, UserPrincipal principal) {
        if (csvContent == null || csvContent.isBlank()) {
            throw new IllegalArgumentException("CSV file content is empty");
        }

        ImportResultResponse result = new ImportResultResponse();
        List<AppointmentResponse> created = new ArrayList<>();
        List<ImportResultResponse.ImportRowError> errors = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(new StringReader(csvContent))) {
            String line;
            int rowNumber = 0;

            while ((line = reader.readLine()) != null) {
                rowNumber++;
                if (line.trim().isEmpty()) continue;

                // Skip header line
                if (rowNumber == 1 && (line.toLowerCase().contains("title") || line.toLowerCase().contains("meeting type"))) {
                    continue;
                }

                String[] parts = parseCsvLine(line);
                if (parts.length < 6) {
                    errors.add(ImportResultResponse.ImportRowError.builder()
                            .rowNumber(rowNumber)
                            .rowData(line)
                            .errorMessage("Insufficient columns. Minimum 6 columns required: Title, Meeting Type, Mode, Start Time, Duration, Attendee Name, Attendee Email")
                            .build());
                    continue;
                }

                try {
                    String title = parts[0].trim();
                    if (title.isEmpty()) throw new IllegalArgumentException("Meeting title is required");

                    MeetingType type = parseMeetingType(parts.length > 1 ? parts[1].trim() : "PRODUCT_DEMO");
                    MeetingMode mode = parseMeetingMode(parts.length > 2 ? parts[2].trim() : "VIRTUAL_GOOGLE_MEET");

                    String startTimeStr = parts.length > 3 ? parts[3].trim() : "";
                    if (startTimeStr.isEmpty()) throw new IllegalArgumentException("Start time is required");
                    LocalDateTime startTime = parseDateTime(startTimeStr);

                    // Pre-validate timing rules
                    LocalDate today = LocalDate.now();
                    LocalTime nowTime = LocalTime.now();
                    if (startTime.toLocalDate().isBefore(today)) {
                        throw new IllegalArgumentException("Scheduled meeting date cannot be in the past (" + startTime.toLocalDate() + ")");
                    }
                    if (startTime.toLocalDate().isEqual(today) && startTime.toLocalTime().isBefore(nowTime.minusMinutes(2))) {
                        throw new IllegalArgumentException("Meeting time cannot be in the past (" + startTime.toLocalTime() + "). Please schedule for upcoming time slots.");
                    }

                    int duration = 30;
                    if (parts.length > 4 && !parts[4].trim().isEmpty()) {
                        try {
                            duration = Integer.parseInt(parts[4].trim());
                        } catch (NumberFormatException e) {
                            duration = 30;
                        }
                    }
                    if (duration < 5 || duration > 480) {
                        throw new IllegalArgumentException("Meeting duration must be between 5 minutes and 8 hours (480 minutes)");
                    }

                    String attendeeName = parts.length > 5 ? parts[5].trim() : "";
                    if (attendeeName.isEmpty()) throw new IllegalArgumentException("Attendee name is required");

                    String attendeeEmail = parts.length > 6 ? parts[6].trim() : "";
                    if (attendeeEmail.isEmpty()) throw new IllegalArgumentException("Attendee email is required");

                    String attendeePhone = parts.length > 7 ? parts[7].trim() : "";
                    if (!attendeePhone.isEmpty() && !attendeePhone.matches("^[0-9]{10}$")) {
                        throw new IllegalArgumentException("Attendee phone number must be exactly 10 digits");
                    }

                    String locationOrLink = parts.length > 8 ? parts[8].trim() : "";
                    String description = parts.length > 9 ? parts[9].trim() : "";
                    EntityType entityType = parts.length > 10 && !parts[10].trim().isEmpty() ? parseEntityType(parts[10].trim()) : EntityType.GENERAL;
                    String entityTitle = parts.length > 11 ? parts[11].trim() : "";

                    CreateAppointmentRequest req = CreateAppointmentRequest.builder()
                            .title(title)
                            .meetingType(type)
                            .meetingMode(mode)
                            .startTime(startTime)
                            .durationMinutes(duration)
                            .attendeeName(attendeeName)
                            .attendeeEmail(attendeeEmail)
                            .attendeePhone(attendeePhone)
                            .location(mode.name().startsWith("VIRTUAL") ? null : locationOrLink)
                            .meetingLink(mode.name().startsWith("VIRTUAL") && locationOrLink.startsWith("http") ? locationOrLink : null)
                            .description(description)
                            .entityType(entityType)
                            .entityTitle(entityTitle)
                            .build();

                    AppointmentResponse createdAppt = appointmentService.createAppointment(req, principal);
                    created.add(createdAppt);

                } catch (Exception e) {
                    errors.add(ImportResultResponse.ImportRowError.builder()
                            .rowNumber(rowNumber)
                            .rowData(line)
                            .errorMessage(e.getMessage())
                            .build());
                }
            }

            result.setTotalRows(created.size() + errors.size());
            result.setSuccessCount(created.size());
            result.setFailureCount(errors.size());
            result.setCreatedAppointments(created);
            result.setErrors(errors);

            log.info("Bulk imported appointments: {} succeeded, {} failed out of {} total",
                    created.size(), errors.size(), result.getTotalRows());

            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to process CSV import: " + e.getMessage(), e);
        }
    }

    private String buildIcsCalendar(List<AppointmentResponse> list) {
        StringBuilder sb = new StringBuilder();
        sb.append("BEGIN:VCALENDAR\r\n");
        sb.append("VERSION:2.0\r\n");
        sb.append("PRODID:-//Basic CRM//Enterprise Meeting Manager 1.0//EN\r\n");
        sb.append("CALSCALE:GREGORIAN\r\n");
        sb.append("METHOD:PUBLISH\r\n");
        sb.append("X-WR-CALNAME:CRM Scheduled Meetings\r\n");
        sb.append("X-WR-TIMEZONE:Asia/Kolkata\r\n");

        for (AppointmentResponse a : list) {
            sb.append("BEGIN:VEVENT\r\n");
            sb.append("UID:crm-meeting-").append(a.getId()).append("@basiccrm.com\r\n");
            sb.append("DTSTAMP:").append(LocalDateTime.now().format(ICS_DATE_FORMAT)).append("Z\r\n");
            if (a.getStartTime() != null) {
                sb.append("DTSTART:").append(a.getStartTime().format(ICS_DATE_FORMAT)).append("\r\n");
            }
            if (a.getEndTime() != null) {
                sb.append("DTEND:").append(a.getEndTime().format(ICS_DATE_FORMAT)).append("\r\n");
            }
            sb.append("SUMMARY:").append(escapeIcs(a.getTitle())).append("\r\n");

            StringBuilder desc = new StringBuilder();
            if (a.getDescription() != null) desc.append(a.getDescription()).append("\\n\\n");
            if (a.getMeetingLink() != null) desc.append("Virtual Meeting Room: ").append(a.getMeetingLink()).append("\\n");
            desc.append("Host: ").append(a.getOrganizerName()).append(" (").append(a.getOrganizerEmail()).append(")\\n");
            desc.append("Attendee: ").append(a.getAttendeeName()).append(" (").append(a.getAttendeeEmail()).append(")");
            sb.append("DESCRIPTION:").append(escapeIcs(desc.toString())).append("\r\n");

            if (a.getMeetingLink() != null) {
                sb.append("LOCATION:").append(escapeIcs(a.getMeetingLink())).append("\r\n");
                sb.append("URL:").append(escapeIcs(a.getMeetingLink())).append("\r\n");
            } else if (a.getLocation() != null) {
                sb.append("LOCATION:").append(escapeIcs(a.getLocation())).append("\r\n");
            }

            sb.append("STATUS:").append(a.getStatus() == AppointmentStatus.CANCELLED ? "CANCELLED" : "CONFIRMED").append("\r\n");

            if (a.getOrganizerEmail() != null) {
                sb.append("ORGANIZER;CN=").append(escapeIcs(a.getOrganizerName())).append(":mailto:").append(a.getOrganizerEmail()).append("\r\n");
            }
            if (a.getAttendeeEmail() != null) {
                sb.append("ATTENDEE;CN=").append(escapeIcs(a.getAttendeeName())).append(";ROLE=REQ-PARTICIPANT:mailto:").append(a.getAttendeeEmail()).append("\r\n");
            }

            sb.append("END:VEVENT\r\n");
        }

        sb.append("END:VCALENDAR\r\n");
        return sb.toString();
    }

    private String escapeCsv(String str) {
        if (str == null) return "\"\"";
        return "\"" + str.replace("\"", "\"\"") + "\"";
    }

    private String escapeIcs(String str) {
        if (str == null) return "";
        return str.replace("\\", "\\\\")
                .replace(";", "\\;")
                .replace(",", "\\,")
                .replace("\n", "\\n")
                .replace("\r", "");
    }

    private String[] parseCsvLine(String line) {
        List<String> tokens = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder sb = new StringBuilder();

        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '\"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '\"') {
                    sb.append('\"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (c == ',' && !inQuotes) {
                tokens.add(sb.toString().trim());
                sb.setLength(0);
            } else {
                sb.append(c);
            }
        }
        tokens.add(sb.toString().trim());
        return tokens.toArray(new String[0]);
    }

    private MeetingType parseMeetingType(String val) {
        try {
            return MeetingType.valueOf(val.toUpperCase().replace(" ", "_"));
        } catch (Exception e) {
            return MeetingType.PRODUCT_DEMO;
        }
    }

    private MeetingMode parseMeetingMode(String val) {
        try {
            return MeetingMode.valueOf(val.toUpperCase().replace(" ", "_"));
        } catch (Exception e) {
            return MeetingMode.VIRTUAL_GOOGLE_MEET;
        }
    }

    private EntityType parseEntityType(String val) {
        try {
            return EntityType.valueOf(val.toUpperCase());
        } catch (Exception e) {
            return EntityType.GENERAL;
        }
    }

    private LocalDateTime parseDateTime(String val) {
        val = val.trim();
        try {
            if (val.contains("T")) {
                if (val.length() == 16) val = val + ":00";
                return LocalDateTime.parse(val);
            }
            return LocalDateTime.parse(val, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        } catch (Exception e) {
            try {
                LocalDate d = LocalDate.parse(val);
                return d.atTime(10, 0);
            } catch (Exception ex) {
                throw new IllegalArgumentException("Invalid date format '" + val + "'. Expected format: YYYY-MM-DDTHH:mm");
            }
        }
    }
}
