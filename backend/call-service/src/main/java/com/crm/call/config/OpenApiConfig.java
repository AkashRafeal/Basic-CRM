package com.crm.call.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI callServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Basic CRM - Call Management Microservice API")
                        .description("Microservice for managing and logging inbound/outbound calls, schedules, dialer records, and call outcomes")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("CRM Engineering Team")
                                .email("support@crm.internal")));
    }
}
