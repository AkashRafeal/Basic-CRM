package com.crm.user.dto;

import com.crm.user.model.Department;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentDTO {

    private Long id;
    private String name;
    private String code;
    private String description;
    private LocalDateTime createdAt;
    private long managerCount;
    private long employeeCount;

    public static DepartmentDTO fromEntity(Department dept) {
        return DepartmentDTO.builder()
                .id(dept.getId())
                .name(dept.getName())
                .code(dept.getCode())
                .description(dept.getDescription())
                .createdAt(dept.getCreatedAt())
                .build();
    }
}
