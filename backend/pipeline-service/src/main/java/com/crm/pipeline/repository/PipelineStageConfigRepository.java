package com.crm.pipeline.repository;

import com.crm.pipeline.model.DealStage;
import com.crm.pipeline.model.PipelineStageConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineStageConfigRepository extends JpaRepository<PipelineStageConfig, Long> {

    List<PipelineStageConfig> findAllByOrderByStageOrderAsc();

    Optional<PipelineStageConfig> findByStage(DealStage stage);

    boolean existsByStage(DealStage stage);
}
