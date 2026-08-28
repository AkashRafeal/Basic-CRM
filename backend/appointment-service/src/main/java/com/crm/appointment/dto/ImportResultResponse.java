package com.crm.appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportResultResponse {

    private int totalRows;
    private int successCount;
    private int failureCount;

    @Builder.Default
    private List<ImportRowError> errors = new ArrayList<>();

    @Builder.Default
    private List<AppointmentResponse> createdAppointments = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ImportRowError {
        private int rowNumber;
        private String rowData;
        private String errorMessage;
    }
}
