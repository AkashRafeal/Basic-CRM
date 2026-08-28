package com.crm.communication.repository;

import com.crm.communication.model.CommunicationGatewayConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CommunicationGatewayConfigRepository extends JpaRepository<CommunicationGatewayConfig, Long> {
}
