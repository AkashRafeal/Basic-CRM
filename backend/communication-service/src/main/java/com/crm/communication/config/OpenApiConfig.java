package com.crm.communication.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI communicationServiceOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Basic CRM - Communication Management Microservice API")
                        .description("Microservice for omnichannel messaging, email logging, SMS/WhatsApp dispatch, and unified inbox")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("CRM Engineering Team")
                                .email("support@crm.internal")));
    }
}
