package com.crm.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompleteAppointmentRequest {

    private String outcomeNotes;

    private String actionItems;

    private String recordingUrl;

    private boolean isNoShow;
}
