package com.crm.contact.repository;

import com.crm.contact.model.Contact;
import com.crm.contact.model.ContactStatus;
import com.crm.contact.model.ContactType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByCustomerIdAndIsArchivedFalseOrderByIsPrimaryContactDescLastNameAsc(Long customerId);

    long countByCustomerId(Long customerId);

    @Query("SELECT c FROM Contact c WHERE " +
           "(:isArchived IS NULL OR c.isArchived = :isArchived) AND " +
           "(:customerId IS NULL OR c.customerId = :customerId) AND " +
           "(:assignedId IS NULL OR c.assignedToUserId = :assignedId) AND " +
           "(:contactType IS NULL OR c.contactType = :contactType OR " +
           "  (:contactType = com.crm.contact.model.ContactType.DECISION_MAKER AND (LOWER(c.tags) LIKE '%decision maker%' OR LOWER(c.tags) LIKE '%decision-maker%')) OR " +
           "  (:contactType = com.crm.contact.model.ContactType.CHAMPION AND LOWER(c.tags) LIKE '%champion%')) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:isPrimary IS NULL OR " +
           "  (:isPrimary = true AND (c.isPrimaryContact = true OR LOWER(c.tags) LIKE '%primary lead%' OR LOWER(c.tags) LIKE '%primary contact%')) OR " +
           "  (:isPrimary = false AND (c.isPrimaryContact = false OR c.isPrimaryContact IS NULL) AND (c.tags IS NULL OR (LOWER(c.tags) NOT LIKE '%primary lead%' AND LOWER(c.tags) NOT LIKE '%primary contact%')))) AND " +
           "(CAST(:search AS string) IS NULL OR :search = '' OR " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.jobTitle) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.department) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.customerName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR " +
           "LOWER(c.tags) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))")
    Page<Contact> searchContacts(
            @Param("search") String search,
            @Param("customerId") Long customerId,
            @Param("assignedId") Long assignedId,
            @Param("contactType") ContactType contactType,
            @Param("status") ContactStatus status,
            @Param("isPrimary") Boolean isPrimary,
            @Param("isArchived") Boolean isArchived,
            Pageable pageable
    );

    @Query("SELECT COUNT(DISTINCT c.customerId) FROM Contact c WHERE c.customerId IS NOT NULL AND c.isArchived = false")
    long countDistinctCustomerIds();

    long countByIsArchivedFalse();

    long countByIsArchivedTrue();

    long countByStatusAndIsArchivedFalse(ContactStatus status);

    @Query("SELECT COUNT(c) FROM Contact c WHERE c.isArchived = false AND (c.isPrimaryContact = true OR LOWER(c.tags) LIKE '%primary lead%' OR LOWER(c.tags) LIKE '%primary contact%')")
    long countPrimaryContacts();

    @Query("SELECT COUNT(c) FROM Contact c WHERE c.isArchived = false AND (c.contactType = com.crm.contact.model.ContactType.DECISION_MAKER OR LOWER(c.tags) LIKE '%decision maker%' OR LOWER(c.tags) LIKE '%decision-maker%')")
    long countDecisionMakers();

    @Query("SELECT COUNT(c) FROM Contact c WHERE c.isArchived = false AND (c.contactType = com.crm.contact.model.ContactType.CHAMPION OR LOWER(c.tags) LIKE '%champion%')")
    long countChampions();

    @Query("SELECT c.contactType, COUNT(c) FROM Contact c WHERE c.isArchived = false GROUP BY c.contactType")
    List<Object[]> countByContactTypeGroup();

    @Query("SELECT c.status, COUNT(c) FROM Contact c WHERE c.isArchived = false GROUP BY c.status")
    List<Object[]> countByStatusGroup();
}
