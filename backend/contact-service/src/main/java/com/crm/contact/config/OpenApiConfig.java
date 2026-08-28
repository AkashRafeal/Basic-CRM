package com.crm.contact.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI contactOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Contact Management Microservice API")
                        .description("REST API for managing stakeholder contacts, decision makers, and account affiliations")
                        .version("1.0.0")
                        .contact(new Contact().name("CRM Enterprise Team").email("support@crm.com")));
    }
}
