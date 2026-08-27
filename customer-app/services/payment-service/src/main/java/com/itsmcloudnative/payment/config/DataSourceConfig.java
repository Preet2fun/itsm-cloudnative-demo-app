package com.itsmcloudnative.payment.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * Builds the connection pool from the single DATABASE_URL env var
 * (postgres://user:pass@host:port/db?sslmode=disable) — same convention
 * every service in this repo uses. Spring Boot's own spring.datasource.*
 * auto-config expects a JDBC-form URL, so it's excluded in favor of this.
 */
@Configuration
public class DataSourceConfig {

    @Value("${DATABASE_URL}")
    private String databaseUrl;

    @Bean
    public DataSource dataSource() {
        ParsedUrl parsed = parse(databaseUrl);

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(parsed.jdbcUrl());
        config.setUsername(parsed.username());
        config.setPassword(parsed.password());
        config.setMaximumPoolSize(10);
        return new HikariDataSource(config);
    }

    private record ParsedUrl(String jdbcUrl, String username, String password) {}

    private static ParsedUrl parse(String databaseUrl) {
        try {
            URI uri = new URI(databaseUrl.replaceFirst("^postgres(ql)?://", "https://"));
            String[] userInfo = uri.getUserInfo().split(":", 2);
            String username = userInfo[0];
            String password = userInfo.length > 1 ? userInfo[1] : "";

            String query = uri.getQuery();
            boolean sslDisabled = query != null && query.contains("sslmode=disable");

            String jdbcUrl = "jdbc:postgresql://" + uri.getHost() + ":" + uri.getPort() + uri.getPath();
            if (sslDisabled) {
                jdbcUrl += "?sslmode=disable";
            }
            return new ParsedUrl(jdbcUrl, username, password);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid DATABASE_URL: " + e.getMessage(), e);
        }
    }
}
