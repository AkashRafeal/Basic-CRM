package com.crm.pipeline.config;

import com.crm.pipeline.model.DealStage;
import com.crm.pipeline.model.PipelineStageConfig;
import com.crm.pipeline.repository.DealRepository;
import com.crm.pipeline.repository.PipelineStageConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final DealRepository dealRepository;
    private final PipelineStageConfigRepository stageConfigRepository;

    @Override
    public void run(String... args) {
        seedPipelineStageConfigs();
        log.info("Pipeline-Service: Ready for real-world deals. Current deals count: {}", dealRepository.count());
    }

    private void seedPipelineStageConfigs() {
        if (stageConfigRepository.count() == 0) {
            log.info("Pipeline-Service: Seeding initial pipeline stage configurations...");
            List<PipelineStageConfig> defaultConfigs = List.of(
                    PipelineStageConfig.builder()
                            .stage(DealStage.QUALIFICATION)
                            .displayName("Qualification")
                            .probability(10)
                            .stageOrder(1)
                            .color("slate")
                            .description("Initial discovery of lead budget, authority, need, and timeline (BANT).")
                            .isActive(true)
                            .build(),
                    PipelineStageConfig.builder()
                            .stage(DealStage.DISCOVERY)
                            .displayName("Discovery & Demo")
                            .probability(30)
                            .stageOrder(2)
                            .color("blue")
                            .description("Technical deep-dive, product demonstration, and requirement mapping.")
                            .isActive(true)
                            .build(),
                    PipelineStageConfig.builder()
                            .stage(DealStage.PROPOSAL)
                            .displayName("Proposal / Quote")
                            .probability(60)
                            .stageOrder(3)
                            .color("indigo")
                            .description("Commercial pricing submitted, RFP response, and formal quotation.")
                            .isActive(true)
                            .build(),
                    PipelineStageConfig.builder()
                            .stage(DealStage.NEGOTIATION)
                            .displayName("Negotiation & Review")
                            .probability(80)
                            .stageOrder(4)
                            .color("amber")
                            .description("Legal terms, SLA agreements, executive sign-off, and discount review.")
                            .isActive(true)
                            .build(),
                    PipelineStageConfig.builder()
                            .stage(DealStage.CLOSED_WON)
                            .displayName("Closed Won")
                            .probability(100)
                            .stageOrder(5)
                            .color("emerald")
                            .description("Contract executed, payment terms finalized, and customer onboarded.")
                            .isActive(true)
                            .build(),
                    PipelineStageConfig.builder()
                            .stage(DealStage.CLOSED_LOST)
                            .displayName("Closed Lost")
                            .probability(0)
                            .stageOrder(6)
                            .color("rose")
                            .description("Opportunity closed without sale with documented reason.")
                            .isActive(true)
                            .build()
            );
            stageConfigRepository.saveAll(defaultConfigs);
            log.info("Pipeline-Service: Initial 6 pipeline stages seeded successfully.");
        }
    }
}
