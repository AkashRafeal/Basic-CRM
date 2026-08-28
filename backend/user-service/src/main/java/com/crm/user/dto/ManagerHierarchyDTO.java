package com.crm.user.dto;

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
public class ManagerHierarchyDTO {
    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private String teamName;
    private boolean active;
    @Builder.Default
    private List<EmployeeSummaryDTO> employees = new ArrayList<>();
}
