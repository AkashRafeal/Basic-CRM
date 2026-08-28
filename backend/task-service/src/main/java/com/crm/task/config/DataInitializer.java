package com.crm.task.config;

import com.crm.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final TaskRepository taskRepository;

    @Override
    public void run(String... args) {
        log.info("Task-Service: Ready for real-world tasks (demo seeder disabled). Current tasks count: {}", taskRepository.count());
    }
}
