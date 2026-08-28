package com.crm.auth.config;

import com.crm.auth.repository.UserAuthRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserAuthRepository userRepository;

    @Override
    public void run(String... args) {
        log.info("Auth-Service: Auto-seeding disabled. No users will be created automatically. Current users count: {}", userRepository.count());
    }
}
