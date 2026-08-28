package com.crm.user.service;

import com.crm.user.dto.*;
import com.crm.user.model.Role;
import com.crm.user.model.User;
import com.crm.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final com.crm.user.repository.DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail().trim().toLowerCase())) {
            throw new IllegalArgumentException("A user with this email address already exists.");
        }

        final Long reqDeptId = request.getDepartmentId();
        Long resolvedDeptId = reqDeptId;
        String resolvedDeptName = request.getDepartment();

        if (reqDeptId != null) {
            com.crm.user.model.Department dept = departmentRepository.findById(reqDeptId)
                    .orElse(null);
            if (dept != null) {
                resolvedDeptId = dept.getId();
                resolvedDeptName = dept.getName();
            }
        }
        
        if (resolvedDeptId == null && resolvedDeptName != null && !resolvedDeptName.trim().isEmpty()) {
            final String cleanName = resolvedDeptName.trim();
            com.crm.user.model.Department dept = departmentRepository.findByNameIgnoreCase(cleanName)
                    .orElseGet(() -> {
                        String code = cleanName.toUpperCase().replaceAll("[^A-Z0-9_]", "_");
                        if (code.length() > 20) code = code.substring(0, 20);
                        if (code.isEmpty()) code = "DEPT";
                        String baseCode = code;
                        int suffix = 1;
                        while (departmentRepository.existsByCodeIgnoreCase(code)) {
                            code = baseCode + "_" + suffix++;
                        }
                        com.crm.user.model.Department newDept = com.crm.user.model.Department.builder()
                                .name(cleanName)
                                .code(code)
                                .description("Custom organizational department for " + cleanName)
                                .build();
                        return departmentRepository.save(newDept);
                    });
            resolvedDeptId = dept.getId();
            resolvedDeptName = dept.getName();
        }

        final Long reqManagerId = request.getManagerId();
        Long resolvedManagerId = reqManagerId;
        String resolvedTeamName = request.getTeamName();

        // Validate Role and Manager Hierarchy
        if (request.getRole() == Role.ROLE_EMPLOYEE) {
            if (reqManagerId != null) {
                User manager = userRepository.findById(reqManagerId)
                        .orElseThrow(() -> new IllegalArgumentException("Selected Manager not found with id: " + reqManagerId));

                if (manager.getRole() != Role.ROLE_MANAGER) {
                    throw new IllegalArgumentException("The selected user is not a Manager.");
                }

                // Enforce: employee.department_id == manager.department_id
                if (resolvedDeptId != null && manager.getDepartmentId() != null && !resolvedDeptId.equals(manager.getDepartmentId())) {
                    throw new IllegalArgumentException("Employee and Manager must belong to the same department.");
                }

                if (resolvedTeamName == null || resolvedTeamName.trim().isEmpty()) {
                    resolvedTeamName = manager.getTeamName();
                }
            } else if (Boolean.TRUE.equals(request.getAutoAssignManager()) || resolvedDeptId != null) {
                // Auto-assign to least loaded manager in the same department
                if (resolvedDeptId != null) {
                    List<User> deptManagers = userRepository.findByDepartmentIdAndRoleAndActiveTrue(resolvedDeptId, Role.ROLE_MANAGER);
                    if (!deptManagers.isEmpty()) {
                        // Find manager with least assigned employees
                        User bestManager = deptManagers.stream()
                                .min((m1, m2) -> Long.compare(userRepository.countByManagerId(m1.getId()), userRepository.countByManagerId(m2.getId())))
                                .orElse(deptManagers.get(0));
                        resolvedManagerId = bestManager.getId();
                        if (resolvedTeamName == null || resolvedTeamName.trim().isEmpty()) {
                            resolvedTeamName = bestManager.getTeamName();
                        }
                    }
                }
            }
        } else if (request.getRole() == Role.ROLE_MANAGER) {
            resolvedManagerId = null; // Managers do not report to other managers
            if (resolvedTeamName == null || resolvedTeamName.trim().isEmpty()) {
                resolvedTeamName = (resolvedDeptName != null ? resolvedDeptName : "Sales") + " Team";
            }
        } else if (request.getRole() == Role.ROLE_ADMIN) {
            resolvedDeptId = null;
            resolvedDeptName = null;
            resolvedManagerId = null;
            if (resolvedTeamName == null || resolvedTeamName.trim().isEmpty()) {
                resolvedTeamName = "Executive Management";
            }
        }

        String cleanPhone = validateAndCleanPhone(request.getPhoneNumber());
        if (cleanPhone != null && userRepository.existsByPhoneNumber(cleanPhone)) {
            throw new IllegalArgumentException("Phone number '" + cleanPhone + "' is already registered with another user.");
        }

        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .department(resolvedDeptName)
                .departmentId(resolvedDeptId)
                .managerId(resolvedManagerId)
                .teamName(resolvedTeamName)
                .phoneNumber(cleanPhone)
                .active(true)
                .build();

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers(String search, Role role, Boolean active) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        return userRepository.searchUsers(cleanSearch, role, active)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getTeamMembers(Long managerId) {
        return userRepository.findByManagerId(managerId)
                .stream()
                .filter(u -> u.getRole() == Role.ROLE_EMPLOYEE)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        final Long reqUpdateDeptId = request.getDepartmentId();
        Long deptId = reqUpdateDeptId != null ? reqUpdateDeptId : user.getDepartmentId();
        String deptName = request.getDepartment() != null ? request.getDepartment().trim() : user.getDepartment();

        if (reqUpdateDeptId != null) {
            com.crm.user.model.Department dept = departmentRepository.findById(reqUpdateDeptId)
                    .orElse(null);
            if (dept != null) {
                deptId = dept.getId();
                deptName = dept.getName();
            }
        }

        if (request.getDepartment() != null && !request.getDepartment().trim().isEmpty() && (reqUpdateDeptId == null || !request.getDepartment().trim().equalsIgnoreCase(deptName))) {
            final String cleanName = request.getDepartment().trim();
            com.crm.user.model.Department dept = departmentRepository.findByNameIgnoreCase(cleanName)
                    .orElseGet(() -> {
                        String code = cleanName.toUpperCase().replaceAll("[^A-Z0-9]", "_");
                        if (code.length() > 20) code = code.substring(0, 20);
                        String baseCode = code;
                        int suffix = 1;
                        while (departmentRepository.existsByCodeIgnoreCase(code)) {
                            code = baseCode + "_" + suffix++;
                        }
                        com.crm.user.model.Department newDept = com.crm.user.model.Department.builder()
                                .name(cleanName)
                                .code(code)
                                .description("Department for " + cleanName)
                                .build();
                        return departmentRepository.save(newDept);
                    });
            deptId = dept.getId();
            deptName = dept.getName();
        }

        final Long reqUpdateManagerId = request.getManagerId();
        Long managerId = reqUpdateManagerId != null ? reqUpdateManagerId : user.getManagerId();

        // Managers and Admins do not report to other managers
        if (user.getRole() == Role.ROLE_MANAGER || user.getRole() == Role.ROLE_ADMIN) {
            managerId = null;
        }

        // Admins have global access and do not belong to a single department
        if (user.getRole() == Role.ROLE_ADMIN) {
            deptId = null;
            deptName = null;
            managerId = null;
        }

        // Department-manager validation for employees
        if (user.getRole() == Role.ROLE_EMPLOYEE && reqUpdateManagerId != null) {
            User manager = userRepository.findById(reqUpdateManagerId)
                    .orElseThrow(() -> new IllegalArgumentException("Selected Manager not found with id: " + reqUpdateManagerId));

            if (manager.getRole() != Role.ROLE_MANAGER) {
                throw new IllegalArgumentException("The selected user is not a Manager.");
            }

            if (deptId != null && manager.getDepartmentId() != null && !deptId.equals(manager.getDepartmentId())) {
                throw new IllegalArgumentException("Employee and Manager must belong to the same department.");
            }
        }

        // If manager's department changed, check assigned employees
        if (user.getRole() == Role.ROLE_MANAGER && deptId != null && !deptId.equals(user.getDepartmentId())) {
            List<User> reportingEmployees = userRepository.findByManagerId(user.getId());
            for (User emp : reportingEmployees) {
                if (emp.getDepartmentId() != null && !emp.getDepartmentId().equals(deptId)) {
                    // Detach from manager to maintain strict department isolation
                    emp.setManagerId(null);
                    userRepository.save(emp);
                }
            }
        }

        user.setName(request.getName().trim());
        user.setDepartment(deptName);
        user.setDepartmentId(deptId);
        user.setManagerId(managerId);
        if (request.getTeamName() != null) {
            user.setTeamName(request.getTeamName().trim());
        }
        if (request.getPhoneNumber() != null) {
            String cleanPhone = validateAndCleanPhone(request.getPhoneNumber());
            if (cleanPhone != null && userRepository.existsByPhoneNumberAndIdNot(cleanPhone, id)) {
                throw new IllegalArgumentException("Phone number '" + cleanPhone + "' is already registered with another user.");
            }
            user.setPhoneNumber(cleanPhone);
        }
        if (request.getActive() != null) {
            user.setActive(request.getActive());
        }

        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    private String validateAndCleanPhone(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return null;
        }
        String clean = phone.trim().replaceAll("[\\s\\-\\(\\)\\+]", "");
        if (clean.startsWith("91") && clean.length() == 12) {
            clean = clean.substring(2);
        }
        if (!clean.matches("^\\d{10}$")) {
            throw new IllegalArgumentException("Phone number must be exactly 10 digits (e.g. 9876543210).");
        }
        return clean;
    }

    private UserResponse mapToResponse(User user) {
        UserResponse res = UserResponse.fromEntity(user);
        if (user.getManagerId() != null) {
            userRepository.findById(user.getManagerId())
                    .ifPresent(mgr -> res.setManagerName(mgr.getName()));
        }
        return res;
    }

    @Transactional
    public UserResponse updateUserRole(Long id, UpdateRoleRequest request, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (user.getId().equals(currentUserId) && user.getRole() == Role.ROLE_ADMIN && request.getRole() != Role.ROLE_ADMIN) {
            long adminCount = userRepository.findByRole(Role.ROLE_ADMIN).size();
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot demote the only remaining Administrator.");
            }
        }

        user.setRole(request.getRole());
        if (request.getRole() == Role.ROLE_ADMIN) {
            user.setDepartment(null);
            user.setDepartmentId(null);
            user.setManagerId(null);
        }
        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public UserResponse toggleUserStatus(Long id, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (user.getId().equals(currentUserId)) {
            throw new IllegalStateException("You cannot disable your own active account.");
        }

        user.setActive(!user.isActive());
        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Current password does not match.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void adminResetPassword(Long userId, AdminResetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteUser(Long id, Long currentUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        if (user.getId().equals(currentUserId)) {
            throw new IllegalStateException("You cannot delete your own account.");
        }

        if (user.getRole() == Role.ROLE_ADMIN) {
            long adminCount = userRepository.findByRole(Role.ROLE_ADMIN).size();
            if (adminCount <= 1) {
                throw new IllegalStateException("Cannot delete the only remaining Administrator.");
            }
        }

        userRepository.delete(user);
    }
}
