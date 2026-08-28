package com.crm.followup.repository;

import com.crm.followup.model.FollowUpCadenceConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FollowUpCadenceConfigRepository extends JpaRepository<FollowUpCadenceConfig, Long> {
}
