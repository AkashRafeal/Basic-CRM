package com.crm.user.service;

import com.crm.user.dto.*;
import com.crm.user.model.Department;
import com.crm.user.model.Role;
import com.crm.user.model.User;
import com.crm.user.repository.DepartmentRepository;
import com.crm.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DepartmentDTO> getAllDepartments() {
        return departmentRepository.findAllByOrderByNameAsc()
                .stream()
                .map(dept -> {
                    DepartmentDTO dto = DepartmentDTO.fromEntity(dept);
                    dto.setManagerCount(userRepository.countByDepartmentIdAndRole(dept.getId(), Role.ROLE_MANAGER));
                    dto.setEmployeeCount(userRepository.countByDepartmentIdAndRole(dept.getId(), Role.ROLE_EMPLOYEE));
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public DepartmentDTO createDepartment(CreateDepartmentRequest request) {
        String cleanName = request.getName().trim();
        if (departmentRepository.existsByNameIgnoreCase(cleanName)) {
            throw new IllegalArgumentException("A department with name '" + cleanName + "' already exists.");
        }

        String code = request.getCode() != null && !request.getCode().trim().isEmpty()
                ? request.getCode().trim().toUpperCase().replaceAll("[^A-Z0-9_]", "_")
                : cleanName.toUpperCase().replaceAll("[^A-Z0-9_]", "_");
        if (code.length() > 20) code = code.substring(0, 20);
        if (code.isEmpty()) code = "DEPT";

        String baseCode = code;
        int suffix = 1;
        while (departmentRepository.existsByCodeIgnoreCase(code)) {
            code = baseCode + "_" + suffix++;
        }

        Department dept = Department.builder()
                .name(cleanName)
                .code(code)
                .description(request.getDescription() != null ? request.getDescription().trim() : "Department for " + cleanName)
                .build();

        Department saved = departmentRepository.save(dept);
        return DepartmentDTO.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<DepartmentHierarchyDTO> getFullHierarchy() {
        List<Department> departments = departmentRepository.findAllByOrderByNameAsc();
        List<User> allUsers = userRepository.findAll();

        Map<Long, List<User>> usersByDepartment = allUsers.stream()
                .filter(u -> u.getDepartmentId() != null)
                .collect(Collectors.groupingBy(User::getDepartmentId));

        List<DepartmentHierarchyDTO> result = new ArrayList<>();

        for (Department dept : departments) {
            List<User> deptUsers = usersByDepartment.getOrDefault(dept.getId(), List.of());

            List<User> managers = deptUsers.stream()
                    .filter(u -> u.getRole() == Role.ROLE_MANAGER)
                    .collect(Collectors.toList());

            List<User> employees = deptUsers.stream()
                    .filter(u -> u.getRole() == Role.ROLE_EMPLOYEE)
                    .collect(Collectors.toList());

            Map<Long, List<User>> employeesByManager = employees.stream()
                    .filter(e -> e.getManagerId() != null)
                    .collect(Collectors.groupingBy(User::getManagerId));

            List<ManagerHierarchyDTO> managerDTOs = new ArrayList<>();
            for (User mgr : managers) {
                List<User> mgrEmployees = employeesByManager.getOrDefault(mgr.getId(), List.of());
                List<EmployeeSummaryDTO> empSummaries = mgrEmployees.stream()
                        .map(e -> EmployeeSummaryDTO.builder()
                                .id(e.getId())
                                .name(e.getName())
                                .email(e.getEmail())
                                .phoneNumber(e.getPhoneNumber())
                                .active(e.isActive())
                                .createdAt(e.getCreatedAt())
                                .build())
                        .collect(Collectors.toList());

                managerDTOs.add(ManagerHierarchyDTO.builder()
                        .id(mgr.getId())
                        .name(mgr.getName())
                        .email(mgr.getEmail())
                        .phoneNumber(mgr.getPhoneNumber())
                        .teamName(mgr.getTeamName())
                        .active(mgr.isActive())
                        .employees(empSummaries)
                        .build());
            }

            List<EmployeeSummaryDTO> unassigned = employees.stream()
                    .filter(e -> e.getManagerId() == null)
                    .map(e -> EmployeeSummaryDTO.builder()
                            .id(e.getId())
                            .name(e.getName())
                            .email(e.getEmail())
                            .phoneNumber(e.getPhoneNumber())
                            .active(e.isActive())
                            .createdAt(e.getCreatedAt())
                            .build())
                    .collect(Collectors.toList());

            result.add(DepartmentHierarchyDTO.builder()
                    .id(dept.getId())
                    .name(dept.getName())
                    .code(dept.getCode())
                    .description(dept.getDescription())
                    .managers(managerDTOs)
                    .unassignedEmployees(unassigned)
                    .build());
        }

        return result;
    }

    @Transactional
    public void deleteDepartment(Long id) {
        Department dept = departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found with id: " + id));

        // Safely detach any users from this department
        List<User> usersInDept = userRepository.findByDepartmentId(id);
        for (User u : usersInDept) {
            u.setDepartmentId(null);
            u.setDepartment(null);
            userRepository.save(u);
        }

        departmentRepository.delete(dept);
    }
}
