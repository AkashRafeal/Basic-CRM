package com.crm.appointment.repository;

import com.crm.appointment.model.IntegrationConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IntegrationConfigRepository extends JpaRepository<IntegrationConfig, Long> {
    Optional<IntegrationConfig> findByProviderKey(String providerKey);
}
