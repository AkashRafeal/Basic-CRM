package com.crm.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeSummaryDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private boolean active;
    private LocalDateTime createdAt;
}
