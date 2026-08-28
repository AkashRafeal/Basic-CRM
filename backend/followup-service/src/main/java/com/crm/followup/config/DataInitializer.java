package com.crm.followup.config;

import com.crm.followup.repository.FollowUpRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final FollowUpRepository followUpRepository;

    @Override
    public void run(String... args) {
        log.info("FollowUp-Service: Ready for real-world touchpoints (demo seeder disabled). Current count: {}", followUpRepository.count());
    }
}
