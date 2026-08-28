package com.crm.customer.repository;

import com.crm.customer.model.CustomerProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CustomerProductRepository extends JpaRepository<CustomerProduct, Long> {
    List<CustomerProduct> findByCustomerIdOrderByPurchaseDateDesc(Long customerId);
    void deleteByCustomerId(Long customerId);
}
