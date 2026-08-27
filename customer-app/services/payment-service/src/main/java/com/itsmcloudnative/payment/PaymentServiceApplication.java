package com.itsmcloudnative.payment;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

/**
 * Entry point for payment-service (Customer App).
 *
 * DataSourceAutoConfiguration is excluded because Spring Boot's default
 * datasource auto-config expects spring.datasource.url in JDBC form; this
 * service instead parses the single DATABASE_URL env var (same convention
 * as every other service in this repo) in {@link com.itsmcloudnative.payment.config.DataSourceConfig}.
 *
 * OpenTelemetry is not wired here — traces/metrics come from the OTel Java
 * auto-instrumentation agent attached via -javaagent (see Dockerfile).
 */
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class PaymentServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PaymentServiceApplication.class, args);
    }
}
