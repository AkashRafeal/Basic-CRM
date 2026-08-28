package com.crm.customer.config;

import com.crm.customer.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final CustomerRepository customerRepository;

    @Override
    public void run(String... args) {
        log.info("Customer-Service: Ready for real-world customer accounts (demo seeder disabled). Current count: {}", customerRepository.count());
    }
}
