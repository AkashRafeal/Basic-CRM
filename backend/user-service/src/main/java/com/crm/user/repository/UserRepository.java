package com.crm.user.repository;

import com.crm.user.model.Role;
import com.crm.user.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumber(String phoneNumber);

    boolean existsByPhoneNumberAndIdNot(String phoneNumber, Long id);

    List<User> findByRole(Role role);

    List<User> findByActiveTrue();

    List<User> findByManagerId(Long managerId);

    List<User> findByDepartmentId(Long departmentId);

    List<User> findByDepartmentIdAndRole(Long departmentId, Role role);

    List<User> findByDepartmentIdAndRoleAndActiveTrue(Long departmentId, Role role);

    long countByManagerId(Long managerId);

    long countByDepartmentIdAndRole(Long departmentId, Role role);

    @Query(
        "SELECT u FROM User u WHERE " +
        "(:role IS NULL OR u.role = :role) AND " +
        "(:active IS NULL OR u.active = :active) AND " +
        "(CAST(:search AS string) IS NULL OR :search = '' OR " +
        " LOWER(u.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
        " LOWER(u.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
        " LOWER(u.department) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))"
    )
    List<User> searchUsers(
        @Param("search") String search,
        @Param("role") Role role,
        @Param("active") Boolean active
    );
}
