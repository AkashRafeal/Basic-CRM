package com.crm.contact.repository;

import com.crm.contact.model.StakeholderTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StakeholderTagRepository extends JpaRepository<StakeholderTag, Long> {
    Optional<StakeholderTag> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
