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
public class DepartmentHierarchyDTO {
    private Long id;
    private String name;
    private String code;
    private String description;
    @Builder.Default
    private List<ManagerHierarchyDTO> managers = new ArrayList<>();
    @Builder.Default
    private List<EmployeeSummaryDTO> unassignedEmployees = new ArrayList<>();
}
