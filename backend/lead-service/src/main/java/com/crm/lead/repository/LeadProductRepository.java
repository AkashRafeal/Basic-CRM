package com.crm.lead.repository;

import com.crm.lead.model.LeadProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeadProductRepository extends JpaRepository<LeadProduct, Long> {
    List<LeadProduct> findByLeadId(Long leadId);
    void deleteByLeadId(Long leadId);
    void deleteByLeadIdAndProductId(Long leadId, Long productId);
    boolean existsByLeadIdAndProductId(Long leadId, Long productId);
}
