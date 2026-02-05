package com.pmsmanus.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String origins = System.getenv("CORS_ALLOWED_ORIGINS");
        if (origins == null || origins.isBlank()) {
            origins = "*";
        }
        registry.addMapping("/api/**")
                .allowedOriginPatterns(origins.split(","))
                .allowedMethods("*")
                .allowedHeaders("*")
                .exposedHeaders("Set-Cookie")
                .allowCredentials(true);
    }
}
