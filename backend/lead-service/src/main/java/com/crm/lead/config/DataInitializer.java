package com.crm.lead.config;

import com.crm.lead.repository.LeadRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final LeadRepository leadRepository;

    @Override
    public void run(String... args) {
        log.info("Lead-Service: Ready for real-world leads (demo seeder disabled). Current leads count: {}", leadRepository.count());
    }
}
