package com.crm.customer.repository;

import com.crm.customer.model.Customer;
import com.crm.customer.model.CustomerStatus;
import com.crm.customer.model.CustomerTier;
import com.crm.customer.model.Industry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {

    @Query("SELECT c FROM Customer c WHERE " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           " LOWER(c.name) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(c.company) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           " LOWER(c.contactPerson) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) AND " +
           "(:status IS NULL OR c.customerStatus = :status) AND " +
           "(:tier IS NULL OR c.customerTier = :tier) AND " +
           "(:industry IS NULL OR c.industry = :industry) AND " +
           "(:assignedId IS NULL OR c.assignedAccountManagerId = :assignedId) AND " +
           "(:isDeleted IS NULL OR c.isDeleted = :isDeleted) " +
           "ORDER BY c.createdAt DESC")
    List<Customer> searchCustomers(
            @Param("search") String search,
            @Param("status") CustomerStatus status,
            @Param("tier") CustomerTier tier,
            @Param("industry") Industry industry,
            @Param("assignedId") Long assignedId,
            @Param("isDeleted") Boolean isDeleted
    );

    long countByCustomerStatusAndIsDeletedFalse(CustomerStatus status);

    long countByCustomerTierAndIsDeletedFalse(CustomerTier tier);

    long countByIsDeletedFalse();

    long countByIsDeletedTrue();

    List<Customer> findByIsDeletedTrueOrderByDeletedAtDesc();

    @Query("SELECT COALESCE(SUM(c.annualRevenue), 0) FROM Customer c WHERE c.customerStatus = 'ACTIVE' AND c.isDeleted = false")
    BigDecimal calculateTotalActiveAnnualRevenue();

    @Query("SELECT COALESCE(SUM(c.annualRevenue), 0) FROM Customer c WHERE c.isDeleted = false")
    BigDecimal calculateTotalAnnualRevenue();

    boolean existsByEmailAndIsDeletedFalse(String email);

    boolean existsByEmail(String email);
}
