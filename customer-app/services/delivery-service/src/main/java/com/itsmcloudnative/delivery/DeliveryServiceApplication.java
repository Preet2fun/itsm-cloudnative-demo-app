package com.itsmcloudnative.delivery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

/**
 * Entry point for delivery-service (Customer App).
 *
 * DataSourceAutoConfiguration is excluded because Spring Boot's default
 * datasource auto-config expects spring.datasource.url in JDBC form; this
 * service instead parses the single DATABASE_URL env var (same convention
 * as every other service in this repo) in {@link com.itsmcloudnative.delivery.config.DataSourceConfig}.
 *
 * OpenTelemetry is not wired here — traces/metrics come from the OTel Java
 * auto-instrumentation agent attached via -javaagent (see Dockerfile), the
 * standard approach for Java rather than manual SDK setup.
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class DeliveryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(DeliveryServiceApplication.class, args);
    }
}
