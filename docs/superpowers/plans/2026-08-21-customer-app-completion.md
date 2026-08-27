# Customer App Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish `customer-app/` — build the missing `payment-service`, wire Redis caching into `catalog-service`, and produce all deployment artifacts (migration tooling, seed data, Helm chart, K8s namespace manifests, CI wiring, deployment guide) — without touching the live Postgres instance or the live K8s cluster.

**Architecture:** `payment-service` is a structural port of the already-built `delivery-service` (Spring Boot 3.2.5, raw JDBC, `X-Tenant-ID`-driven `search_path` isolation). `catalog-service`'s cache module is a structural port of Platform App's `asset-service/app/cache.py`. The Helm chart is a structural port of `platform-app/infra/helm/itsm-app`'s per-service template layout, deployed to a single new `customer-app-dev`/`customer-app-qa` namespace (not per-tenant — tenant isolation stays entirely at the `X-Tenant-ID` + DB-schema layer, matching what Platform App itself actually runs today).

**Tech Stack:** Java 21 / Spring Boot 3.2.5 (payment-service), Python 3.12 / FastAPI (catalog-service cache wiring), Helm 3.15+, golang-migrate v4, bash.

**Spec:** `docs/superpowers/specs/2026-08-20-customer-app-completion-design.md`

## Global Constraints

- HPA is always `minReplicas: 1`, `maxReplicas: 2`, `targetCPUUtilizationPercentage: 70` — never higher (repo-wide non-negotiable rule).
- `order-service`/`catalog-service` resources: CPU 100m request / 300m limit, memory 128Mi request / 256Mi limit (existing Go/Python row).
- `delivery-service`/`payment-service` resources: same numbers as above (128Mi/256Mi) per explicit user decision, mitigated by `-XX:MaxRAMPercentage=75.0` on the JVM entrypoint — not eliminated, flagged as a live-validation risk in the deployment guide.
- `redis` (customer-app's dedicated instance) resources: CPU 50m/200m, memory 64Mi/256Mi, 1Gi PVC on `local-path` StorageClass.
- Single `DATABASE_URL` env var everywhere — never split into host/port/user/pass.
- `search_path` is set per-connection at request/query time, never in the DSN.
- Services never validate JWTs themselves and never enforce RBAC in-process — tenant slug comes from the `X-Tenant-ID` header, validated against `^[a-z][a-z0-9_]{0,62}$`.
- `ENV=dev|qa` everywhere, default `dev`.
- No K8s manifests or Helm resources for Postgres itself (external, standalone).
- No Docker Compose anywhere.
- Migration tracking table for customer-app is `customer_app_schema_migrations` (via `x-migrations-table` query param on `DATABASE_URL`), kept isolated from Platform App's own `schema_migrations` table on the same Postgres instance.
- **No task in this plan runs a migration against the live Postgres or applies anything to the live K8s cluster.** All verification is local: `mvn`, `python3 -m py_compile`, `bash -n`, `helm lint`/`helm template`, YAML parsing.

---

### Task 1: payment-service — scaffold, tenant isolation, domain model

**Files:**
- Create: `customer-app/services/payment-service/pom.xml`
- Create: `customer-app/services/payment-service/Dockerfile`
- Create: `customer-app/services/payment-service/src/main/resources/application.yml`
- Create: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/PaymentServiceApplication.java`
- Create: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/config/DataSourceConfig.java`
- Create: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/tenant/TenantContext.java`
- Create: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/tenant/TenantFilter.java`
- Create: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/payment/Payment.java`
- Create: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/payment/PaymentRepository.java`
- Modify: `customer-app/services/delivery-service/Dockerfile`

**Interfaces:**
- Produces: `TenantContext.get()/set(String)/clear()` (static, thread-local tenant slug — consumed by Task 2's `PaymentController`).
- Produces: `Payment(UUID id, UUID orderId, BigDecimal amount, String status, String paymentMethod, OffsetDateTime createdAt)` record, `Payment.VALID_STATUSES` (`Set<String>` of `pending`/`completed`/`failed`/`refunded`) — consumed by Task 2.
- Produces: `PaymentRepository` with methods `findByOrderId(String tenantSlug, UUID orderId) throws SQLException -> List<Payment>`, `findById(String tenantSlug, UUID id) throws SQLException -> Optional<Payment>`, `create(String tenantSlug, UUID orderId, BigDecimal amount, String paymentMethod, String status) throws SQLException -> Payment`, `updateStatus(String tenantSlug, UUID id, String status) throws SQLException -> Optional<Payment>` — consumed by Task 2.

This task is a structural port of already-working code (`delivery-service`'s equivalent files) plus the new `payments`-table-shaped domain classes. None of it is new business logic — the raw-JDBC repository can't be meaningfully unit tested without a live database (matches `delivery-service`'s own precedent, which has no tests either), so verification here is a compile check, not TDD. Real TDD starts in Task 2, where the actual new business logic (mock-processing threshold, transition validation) lives.

- [ ] **Step 1: Create `pom.xml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.5</version>
        <relativePath/>
    </parent>

    <groupId>com.itsmcloudnative</groupId>
    <artifactId>payment-service</artifactId>
    <version>0.1.0</version>
    <name>payment-service</name>
    <description>Customer App mock payment processing service</description>

    <properties>
        <java.version>21</java.version>
    </properties>

    <dependencies>
        <!-- Web + raw JDBC only — no JPA/Hibernate, matching delivery-service's
             plain-SQL search_path-per-connection pattern. -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-jdbc</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <finalName>payment-service</finalName>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
```

- [ ] **Step 2: Create `Dockerfile`**

```dockerfile
# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /src

COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q package -DskipTests

# ── Stage 2: Run ─────────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S nonroot && adduser -S nonroot -G nonroot

WORKDIR /app

# OTel Java auto-instrumentation agent — same standard approach as
# delivery-service, zero telemetry code needed in the service itself.
ADD https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases/latest/download/opentelemetry-javaagent.jar /app/otel-javaagent.jar

COPY --from=builder /src/target/payment-service.jar /app/payment-service.jar
RUN chown -R nonroot:nonroot /app

USER nonroot:nonroot

EXPOSE 8080

ENV OTEL_SERVICE_NAME=payment-service
ENV OTEL_RESOURCE_ATTRIBUTES=service.namespace=customer-app
ENV OTEL_TRACES_EXPORTER=otlp
ENV OTEL_METRICS_EXPORTER=otlp
ENV OTEL_EXPORTER_OTLP_PROTOCOL=grpc
ENV OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

# MaxRAMPercentage sizes the JVM heap off the container's *memory limit*
# (256Mi) rather than the host's total RAM, which is what the JVM defaults
# to otherwise — without this, a container capped at 256Mi but scheduled on
# a host with several GB free would still try to size its default heap off
# the host, and get OOMKilled almost immediately. This mitigates but doesn't
# eliminate the risk of running a JVM service in a 128Mi/256Mi envelope —
# needs live validation once deployed.
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-javaagent:/app/otel-javaagent.jar", "-jar", "/app/payment-service.jar"]
```

- [ ] **Step 3: Retrofit `delivery-service/Dockerfile` with the same JVM sizing flag**

`delivery-service` has the identical OOM risk (it's also capped at 256Mi) but shipped without this flag. Modify its `ENTRYPOINT` line:

In `customer-app/services/delivery-service/Dockerfile`, change:

```dockerfile
ENTRYPOINT ["java", "-javaagent:/app/otel-javaagent.jar", "-jar", "/app/delivery-service.jar"]
```

to:

```dockerfile
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-javaagent:/app/otel-javaagent.jar", "-jar", "/app/delivery-service.jar"]
```

- [ ] **Step 4: Create `src/main/resources/application.yml`**

```yaml
server:
  port: ${PAYMENT_SERVICE_PORT:8080}

spring:
  application:
    name: payment-service

logging:
  pattern:
    console: '{"timestamp":"%d","level":"%p","service":"payment-service","message":"%m"}%n'
```

- [ ] **Step 5: Create `PaymentServiceApplication.java`**

```java
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
```

- [ ] **Step 6: Create `config/DataSourceConfig.java`**

```java
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
```

- [ ] **Step 7: Create `tenant/TenantContext.java`**

```java
package com.itsmcloudnative.payment.tenant;

/** Holds the current request's tenant slug, set by {@link TenantFilter}. */
public final class TenantContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String slug) {
        CURRENT.set(slug);
    }

    public static String get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
```

- [ ] **Step 8: Create `tenant/TenantFilter.java`**

```java
package com.itsmcloudnative.payment.tenant;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * Extracts X-Tenant-ID from request headers and stores it for the duration
 * of the request. Same validated-slug pattern as order-service (Go),
 * catalog-service (Python), and delivery-service (Java). Health checks are
 * exempt.
 */
@Component
public class TenantFilter extends HttpFilter {

    private static final Pattern SLUG = Pattern.compile("^[a-z][a-z0-9_]{0,62}$");

    @Override
    protected void doFilter(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws IOException, ServletException {
        if (req.getRequestURI().equals("/api/v1/health")) {
            chain.doFilter(req, res);
            return;
        }

        String slug = req.getHeader("X-Tenant-ID");
        if (slug == null || slug.isEmpty()) {
            res.sendError(HttpServletResponse.SC_BAD_REQUEST, "X-Tenant-ID header is required");
            return;
        }
        if (!SLUG.matcher(slug).matches()) {
            res.sendError(HttpServletResponse.SC_BAD_REQUEST, "X-Tenant-ID header contains invalid characters");
            return;
        }

        try {
            TenantContext.set(slug);
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear();
        }
    }
}
```

- [ ] **Step 9: Create `payment/Payment.java`**

```java
package com.itsmcloudnative.payment.payment;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

/** Mirrors the payments table created by public.create_customer_tenant_schema. */
public record Payment(
        UUID id,
        UUID orderId,
        BigDecimal amount,
        String status,
        String paymentMethod,
        OffsetDateTime createdAt
) {
    public static final Set<String> VALID_STATUSES =
            Set.of("pending", "completed", "failed", "refunded");
}
```

- [ ] **Step 10: Create `payment/PaymentRepository.java`**

```java
package com.itsmcloudnative.payment.payment;

import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Raw-JDBC access to the payments table. Every method sets search_path on
 * the connection it borrows before querying — same tenant-isolation pattern
 * as delivery-service's DeliveryRepository.
 */
@Repository
public class PaymentRepository {

    private static final Pattern SLUG = Pattern.compile("^[a-z][a-z0-9_]{0,62}$");

    private final DataSource dataSource;

    public PaymentRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public List<Payment> findByOrderId(String tenantSlug, UUID orderId) throws SQLException {
        List<Payment> results = new ArrayList<>();
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, order_id, amount, status, payment_method, created_at " +
                            "FROM payments WHERE order_id = ? ORDER BY created_at DESC")) {
                ps.setObject(1, orderId);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        results.add(map(rs));
                    }
                }
            }
        }
        return results;
    }

    public Optional<Payment> findById(String tenantSlug, UUID id) throws SQLException {
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, order_id, amount, status, payment_method, created_at " +
                            "FROM payments WHERE id = ?")) {
                ps.setObject(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    return rs.next() ? Optional.of(map(rs)) : Optional.empty();
                }
            }
        }
    }

    public Payment create(String tenantSlug, UUID orderId, BigDecimal amount, String paymentMethod, String status) throws SQLException {
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO payments (order_id, amount, payment_method, status) VALUES (?, ?, ?, ?) " +
                            "RETURNING id, order_id, amount, status, payment_method, created_at")) {
                ps.setObject(1, orderId);
                ps.setBigDecimal(2, amount);
                ps.setString(3, paymentMethod);
                ps.setString(4, status);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    return map(rs);
                }
            }
        }
    }

    public Optional<Payment> updateStatus(String tenantSlug, UUID id, String status) throws SQLException {
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE payments SET status = ? WHERE id = ? " +
                            "RETURNING id, order_id, amount, status, payment_method, created_at")) {
                ps.setString(1, status);
                ps.setObject(2, id);
                try (ResultSet rs = ps.executeQuery()) {
                    return rs.next() ? Optional.of(map(rs)) : Optional.empty();
                }
            }
        }
    }

    private Connection borrowTenantConnection(String tenantSlug) throws SQLException {
        if (!SLUG.matcher(tenantSlug).matches()) {
            throw new IllegalArgumentException("Invalid tenant slug: " + tenantSlug);
        }
        Connection conn = dataSource.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(
                "SET search_path TO \"" + tenantSlug + "\", public")) {
            // slug is validated above against SLUG — safe to inline into SET,
            // which (like Postgres generally) doesn't support bind params here.
            ps.execute();
        } catch (SQLException e) {
            conn.close();
            throw e;
        }
        return conn;
    }

    private static Payment map(ResultSet rs) throws SQLException {
        return new Payment(
                (UUID) rs.getObject("id"),
                (UUID) rs.getObject("order_id"),
                rs.getBigDecimal("amount"),
                rs.getString("status"),
                rs.getString("payment_method"),
                rs.getObject("created_at", OffsetDateTime.class)
        );
    }
}
```

- [ ] **Step 11: Verify it compiles**

Run: `cd customer-app/services/payment-service && mvn -q compile`
Expected: exits 0, no output (Maven's `-q` is silent on success).

- [ ] **Step 12: Commit**

```bash
git add customer-app/services/payment-service customer-app/services/delivery-service/Dockerfile
git commit -m "feat: payment-service scaffold, tenant isolation, and domain model"
```

---

### Task 2: payment-service — PaymentController (TDD)

**Files:**
- Create: `customer-app/services/payment-service/src/main/java/com/itsmcloudnative/payment/payment/PaymentController.java`
- Create: `customer-app/services/payment-service/src/test/java/com/itsmcloudnative/payment/payment/PaymentControllerTest.java`
- Modify: `customer-app/services/payment-service/README.md` (currently the "not built yet" placeholder)

**Interfaces:**
- Consumes: `TenantContext.get()` (Task 1), `Payment` record + `Payment.VALID_STATUSES` (Task 1), `PaymentRepository` (Task 1).
- Produces: `PaymentController(PaymentRepository repo)` with `health()`, `listByOrder(UUID orderId)`, `create(CreatePaymentRequest)`, `getById(UUID id)`, `updateStatus(UUID id, UpdateStatusRequest)` — no later task depends on this.

This is where the actual new business logic lives: the mock-processor's amount-based resolution (`amount <= 0` → `failed`, otherwise `completed`) and the status-transition guard (only `completed → refunded` is allowed post-creation). Both get real unit tests, using a plain JUnit 5 + Mockito test that constructs `PaymentController` directly (no Spring context, no MockMvc) — this avoids `@WebMvcTest` slice/filter-registration complexity entirely while still exercising the real logic, and works with tooling already declared in `pom.xml` (`spring-boot-starter-test` bundles JUnit 5, Mockito, and AssertJ).

- [ ] **Step 1: Write the failing tests**

Create `PaymentControllerTest.java`:

```java
package com.itsmcloudnative.payment.payment;

import com.itsmcloudnative.payment.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PaymentControllerTest {

    private PaymentRepository repo;
    private PaymentController controller;

    @BeforeEach
    void setUp() {
        repo = mock(PaymentRepository.class);
        controller = new PaymentController(repo);
        TenantContext.set("customer_a");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_withPositiveAmount_resolvesToCompleted() throws Exception {
        UUID orderId = UUID.randomUUID();
        BigDecimal amount = new BigDecimal("12.50");
        when(repo.create(eq("customer_a"), eq(orderId), eq(amount), eq("mock"), eq("completed")))
                .thenReturn(new Payment(UUID.randomUUID(), orderId, amount, "completed", "mock", OffsetDateTime.now()));

        ResponseEntity<Payment> response =
                controller.create(new PaymentController.CreatePaymentRequest(orderId, amount, null));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().status()).isEqualTo("completed");
    }

    @Test
    void create_withZeroAmount_resolvesToFailed() throws Exception {
        UUID orderId = UUID.randomUUID();
        BigDecimal amount = new BigDecimal("0.00");
        when(repo.create(eq("customer_a"), eq(orderId), eq(amount), eq("mock"), eq("failed")))
                .thenReturn(new Payment(UUID.randomUUID(), orderId, amount, "failed", "mock", OffsetDateTime.now()));

        ResponseEntity<Payment> response =
                controller.create(new PaymentController.CreatePaymentRequest(orderId, amount, null));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().status()).isEqualTo("failed");
    }

    @Test
    void create_withNullOrderId_isRejected() {
        assertThatThrownBy(() ->
                controller.create(new PaymentController.CreatePaymentRequest(null, new BigDecimal("5.00"), null)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
    }

    @Test
    void updateStatus_completedToRefunded_isAllowed() throws Exception {
        UUID id = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        Payment existing = new Payment(id, orderId, new BigDecimal("12.50"), "completed", "mock", OffsetDateTime.now());
        when(repo.findById("customer_a", id)).thenReturn(Optional.of(existing));
        when(repo.updateStatus("customer_a", id, "refunded"))
                .thenReturn(Optional.of(new Payment(id, orderId, new BigDecimal("12.50"), "refunded", "mock", OffsetDateTime.now())));

        Payment result = controller.updateStatus(id, new PaymentController.UpdateStatusRequest("refunded"));

        assertThat(result.status()).isEqualTo("refunded");
    }

    @Test
    void updateStatus_pendingToCompleted_isRejected() throws Exception {
        UUID id = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        Payment existing = new Payment(id, orderId, new BigDecimal("12.50"), "pending", "mock", OffsetDateTime.now());
        when(repo.findById("customer_a", id)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() ->
                controller.updateStatus(id, new PaymentController.UpdateStatusRequest("completed")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
    }
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd customer-app/services/payment-service && mvn -q test`
Expected: FAIL — compile error, `PaymentController` does not exist yet.

- [ ] **Step 3: Write `PaymentController.java`**

```java
package com.itsmcloudnative.payment.payment;

import com.itsmcloudnative.payment.tenant.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {

    private final PaymentRepository repo;

    public PaymentController(PaymentRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "payment-service");
    }

    @GetMapping("/payments")
    public List<Payment> listByOrder(@RequestParam UUID orderId) {
        try {
            return repo.findByOrderId(TenantContext.get(), orderId);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    /**
     * Mock payment processing resolves synchronously on create — there's no
     * real external gateway to await. amount <= 0 resolves to "failed",
     * everything else resolves to "completed". "pending" is a valid status
     * per the payments table's CHECK constraint but is never produced by
     * this service — it's schema headroom, not a reachable state here.
     */
    @PostMapping("/payments")
    public ResponseEntity<Payment> create(@RequestBody CreatePaymentRequest req) {
        if (req.orderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "order_id is required");
        }
        if (req.amount() == null || req.amount().scale() > 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "amount must be a valid monetary value");
        }
        String method = (req.paymentMethod() == null || req.paymentMethod().isBlank()) ? "mock" : req.paymentMethod();
        String status = req.amount().compareTo(BigDecimal.ZERO) <= 0 ? "failed" : "completed";
        try {
            Payment created = repo.create(TenantContext.get(), req.orderId(), req.amount(), method, status);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @GetMapping("/payments/{id}")
    public Payment getById(@PathVariable UUID id) {
        try {
            return repo.findById(TenantContext.get(), id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    /**
     * The only transition this mock processor supports post-creation is a
     * refund of a completed payment — payments resolve to completed/failed
     * immediately on create, so there's no "authorize then capture" flow to
     * model, and un-refunding or un-failing a payment isn't realistic.
     */
    @PutMapping("/payments/{id}/status")
    public Payment updateStatus(@PathVariable UUID id, @RequestBody UpdateStatusRequest req) {
        if (!Payment.VALID_STATUSES.contains(req.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        try {
            Payment existing = repo.findById(TenantContext.get(), id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
            if (!("completed".equals(existing.status()) && "refunded".equals(req.status()))) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "invalid status transition: " + existing.status() + " -> " + req.status());
            }
            return repo.updateStatus(TenantContext.get(), id, req.status())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "payment not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    private ResponseStatusException internalError(SQLException e) {
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "internal error", e);
    }

    public record CreatePaymentRequest(UUID orderId, BigDecimal amount, String paymentMethod) {}

    public record UpdateStatusRequest(String status) {}
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd customer-app/services/payment-service && mvn -q test`
Expected: PASS, all 5 tests green.

- [ ] **Step 5: Replace `README.md`**

```markdown
# payment-service

Language: Java 21, Spring Boot 3.2 (Web + raw JDBC — no JPA/Hibernate),
mirrors `delivery-service`'s conventions exactly: `X-Tenant-ID` →
`search_path`-per-connection tenant isolation, single `DATABASE_URL` env
var parsed manually for HikariCP, OTel Java auto-instrumentation agent
tagged `service.namespace=customer-app`.

Payments resolve synchronously on creation — there's no real external
payment gateway to await, so `amount <= 0` resolves to `failed` and
everything else resolves to `completed`. The only supported post-creation
transition is `completed → refunded`.

## Endpoints

| Method | Path | Notes |
|---|---|---|
| GET | `/api/v1/health` | no tenant required |
| GET | `/api/v1/payments?orderId=` | list payments for an order |
| POST | `/api/v1/payments` | create — resolves to `completed`/`failed` immediately |
| GET | `/api/v1/payments/{id}` | get |
| PUT | `/api/v1/payments/{id}/status` | `completed → refunded` only — all other transitions rejected (400) |

## Config (env vars)

| Var | Required | Default |
|---|---|---|
| `DATABASE_URL` | yes | — |
| `PAYMENT_SERVICE_PORT` | no | `8080` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | no | `http://localhost:4317` |
| `OTEL_SERVICE_NAME` | no | `payment-service` (set in Dockerfile) |

## Local build/verify

```
mvn compile   # or: mvn package -DskipTests
mvn test
```
```

- [ ] **Step 6: Commit**

```bash
git add customer-app/services/payment-service
git commit -m "feat: payment-service PaymentController with mock processing and transition validation"
```

---

### Task 3: catalog-service — Redis cache-aside wiring

**Files:**
- Create: `customer-app/services/catalog-service/app/cache.py`
- Modify: `customer-app/services/catalog-service/app/config.py`
- Modify: `customer-app/services/catalog-service/app/main.py`
- Modify: `customer-app/services/catalog-service/app/router.py`
- Modify: `customer-app/services/catalog-service/requirements.txt`

**Interfaces:**
- Produces: `cache.init_cache(redis_url: str)`, `cache.close_cache()`, `cache.cache_get(tenant_slug, resource, operation, params) -> str | None`, `cache.cache_set(tenant_slug, resource, operation, params, value, ttl=60)`, `cache.cache_invalidate(tenant_slug, resource)` — no later task depends on these (this is the last customer-app application-code task).

This is one feature spanning 5 files — cache.py alone does nothing without the router wiring, so it's one task rather than split further. Direct port of `platform-app/services/asset-service/app/cache.py`'s pattern (already working, already in production use by asset-service), with the key prefix changed from `itsm:` to `customer:` since this is a dedicated Redis instance for customer-app (per the approved design). No new test infrastructure — this repo's Python services have zero pytest setup today (confirmed: no test files under any Python service), and `asset-service`'s own `cache.py` has no tests either. Verification here is `python3 -m py_compile` on every touched file, matching the level of rigor the pattern being ported already has.

- [ ] **Step 1: Create `app/cache.py`**

```python
import hashlib
import json
import logging

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)

_redis: aioredis.Redis | None = None


def init_cache(redis_url: str) -> None:
    global _redis
    _redis = aioredis.from_url(redis_url, decode_responses=True)
    logger.info("Redis client initialised")


async def close_cache() -> None:
    if _redis:
        await _redis.aclose()
        logger.info("Redis client closed")


def _cache_key(tenant_slug: str, resource: str, operation: str, params: dict) -> str:
    h = hashlib.md5(json.dumps(params, sort_keys=True).encode()).hexdigest()[:8]
    return f"customer:{tenant_slug}:{resource}:{operation}:{h}"


async def cache_get(tenant_slug: str, resource: str, operation: str, params: dict) -> str | None:
    key = _cache_key(tenant_slug, resource, operation, params)
    try:
        return await _redis.get(key)
    except Exception as exc:
        logger.warning("Redis GET failed (non-fatal): %s", exc)
        return None


async def cache_set(
    tenant_slug: str,
    resource: str,
    operation: str,
    params: dict,
    value: str,
    ttl: int = 60,
) -> None:
    key = _cache_key(tenant_slug, resource, operation, params)
    try:
        await _redis.set(key, value, ex=ttl)
    except Exception as exc:
        logger.warning("Redis SET failed (non-fatal): %s", exc)


async def cache_invalidate(tenant_slug: str, resource: str) -> None:
    """Delete all cache keys for a tenant+resource on write operations."""
    pattern = f"customer:{tenant_slug}:{resource}:*"
    try:
        async for key in _redis.scan_iter(pattern):
            await _redis.delete(key)
    except Exception as exc:
        logger.warning("Redis invalidate failed (non-fatal): %s", exc)
```

- [ ] **Step 2: Modify `app/config.py`** to add `redis_url`

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    redis_url: str
    env: str = "dev"
    catalog_service_port: int = 8000
    otel_service_name: str = "catalog-service"
    otel_exporter_otlp_endpoint: str = "http://localhost:4317"


settings = Settings()
```

- [ ] **Step 3: Modify `app/main.py`** to wire cache lifecycle + Redis instrumentation

```python
import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor

from app import cache, db
from app.config import settings
from app.db import close_db, init_db
from app.router import router
from app.telemetry import setup_telemetry

logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp":"%(asctime)s","level":"%(levelname)s","service":"catalog-service","message":"%(message)s"}',
)
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    setup_telemetry(settings.otel_service_name, settings.otel_exporter_otlp_endpoint, settings.env)

    app = FastAPI(title="Customer App Catalog Service", version="1.0.0", docs_url="/docs")

    @app.on_event("startup")
    async def startup():
        init_db(settings.database_url)
        cache.init_cache(settings.redis_url)
        SQLAlchemyInstrumentor().instrument(engine=db._engine.sync_engine)
        RedisInstrumentor().instrument()
        logger.info("Catalog service started: env=%s", settings.env)

    @app.on_event("shutdown")
    async def shutdown():
        await close_db()
        await cache.close_cache()

    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        return JSONResponse(status_code=400, content={"error": str(exc)})

    FastAPIInstrumentor.instrument_app(app)
    app.include_router(router)
    return app


app = create_app()
```

- [ ] **Step 4: Modify `app/router.py`** to wire cache-aside into `list_restaurants`/`create_restaurant`

```python
from __future__ import annotations

import json
import re
import time
import uuid

from fastapi import APIRouter, Header, HTTPException, Query

from app import cache, repository
from app.db import tenant_session
from app.models import (
    MenuItemCreate,
    MenuItemResponse,
    RestaurantCreate,
    RestaurantListResponse,
    RestaurantResponse,
)
from app.telemetry import get_meter, get_tracer

router = APIRouter(prefix="/api/v1")

_tracer = get_tracer()
_meter = get_meter()

_restaurants_created = _meter.create_counter(
    "customer_restaurants_created_total", description="Restaurants created"
)
_menu_items_created = _meter.create_counter(
    "customer_menu_items_created_total", description="Menu items created"
)
_cache_duration = _meter.create_histogram(
    "customer_catalog_cache_duration_seconds", unit="s", description="Cache lookup duration"
)


def _tenant(x_tenant_id: str = Header(..., alias="X-Tenant-ID")) -> str:
    if not re.match(r"^[a-z][a-z0-9_]{0,62}$", x_tenant_id):
        raise HTTPException(status_code=400, detail="X-Tenant-ID contains invalid characters")
    return x_tenant_id


# ── Health ─────────────────────────────────────────────────────────────────────

@router.get("/health")
async def health():
    return {"status": "ok", "service": "catalog-service"}


# ── Restaurants ────────────────────────────────────────────────────────────────

@router.get("/restaurants", response_model=RestaurantListResponse)
async def list_restaurants(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    params = {"limit": limit, "offset": offset}

    with _tracer.start_as_current_span("customer.catalog.cache_lookup") as span:
        span.set_attribute("tenant.id", tenant_id)
        t0 = time.perf_counter()
        cached = await cache.cache_get(tenant_id, "restaurants", "list", params)
        hit = cached is not None
        duration = time.perf_counter() - t0
        span.set_attribute("cache.hit", hit)
        _cache_duration.record(duration, {"tenant_id": tenant_id, "cache_hit": str(hit).lower()})

    if cached:
        return RestaurantListResponse(**json.loads(cached))

    with _tracer.start_as_current_span("customer.catalog.list_restaurants") as span:
        span.set_attribute("tenant.id", tenant_id)
        async with tenant_session(tenant_id) as session:
            restaurants, total = await repository.list_restaurants(session, limit, offset)
        span.set_attribute("result.count", len(restaurants))

    result = RestaurantListResponse(
        restaurants=[RestaurantResponse(**r) for r in restaurants],
        total=total,
        limit=limit,
        offset=offset,
    )
    await cache.cache_set(tenant_id, "restaurants", "list", params, result.model_dump_json(), ttl=60)
    return result


@router.post("/restaurants", response_model=RestaurantResponse, status_code=201)
async def create_restaurant(
    body: RestaurantCreate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    with _tracer.start_as_current_span("customer.catalog.create_restaurant") as span:
        span.set_attribute("tenant.id", tenant_id)
        async with tenant_session(tenant_id) as session:
            restaurant = await repository.create_restaurant(session, body)
        span.set_attribute("restaurant.id", str(restaurant["id"]))

    await cache.cache_invalidate(tenant_id, "restaurants")
    _restaurants_created.add(1, {"tenant_id": tenant_id})
    return RestaurantResponse(**restaurant)


@router.get("/restaurants/{restaurant_id}", response_model=RestaurantResponse)
async def get_restaurant(
    restaurant_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        restaurant = await repository.get_restaurant(session, restaurant_id)
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    return RestaurantResponse(**restaurant)


# ── Menu items ─────────────────────────────────────────────────────────────────
# Not cached — mirrors asset-service, which doesn't cache its nested
# sub-resources (get_asset_incidents) either.

@router.get("/restaurants/{restaurant_id}/menu-items", response_model=list[MenuItemResponse])
async def list_menu_items(
    restaurant_id: uuid.UUID,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    async with tenant_session(tenant_id) as session:
        items = await repository.list_menu_items(session, restaurant_id)
    return [MenuItemResponse(**i) for i in items]


@router.post(
    "/restaurants/{restaurant_id}/menu-items", response_model=MenuItemResponse, status_code=201
)
async def create_menu_item(
    restaurant_id: uuid.UUID,
    body: MenuItemCreate,
    tenant_id: str = Header(..., alias="X-Tenant-ID"),
):
    _tenant(tenant_id)
    with _tracer.start_as_current_span("customer.catalog.create_menu_item") as span:
        span.set_attribute("tenant.id", tenant_id)
        span.set_attribute("restaurant.id", str(restaurant_id))
        async with tenant_session(tenant_id) as session:
            item = await repository.create_menu_item(session, restaurant_id, body)

    _menu_items_created.add(1, {"tenant_id": tenant_id})
    return MenuItemResponse(**item)
```

- [ ] **Step 5: Modify `requirements.txt`** — append two lines (matching `asset-service`'s exact pinned versions):

```
redis[asyncio]==5.0.4
opentelemetry-instrumentation-redis==0.48b0
```

- [ ] **Step 6: Verify syntax**

Run: `cd customer-app/services/catalog-service && python3 -m py_compile app/cache.py app/config.py app/main.py app/router.py`
Expected: exits 0, no output.

- [ ] **Step 7: Commit**

```bash
git add customer-app/services/catalog-service
git commit -m "feat: wire Redis cache-aside into catalog-service restaurant listing"
```

---

### Task 4: Migration tooling and tenant creation script

**Files:**
- Create: `customer-app/scripts/run-migrations.sh`
- Create: `customer-app/scripts/create-customer-tenants.sh`

**Interfaces:**
- Produces: two standalone bash scripts, no other task depends on them (they're the live-deployment entry points documented in Task 6's deployment guide).

- [ ] **Step 1: Create `scripts/run-migrations.sh`**

```bash
#!/usr/bin/env bash
# Script: run-migrations.sh
# Description: Runs golang-migrate against customer-app's migrations,
#              tracked in its own schema_migrations table
#              (customer_app_schema_migrations) so it doesn't collide with
#              Platform App's default-named tracking table on the same
#              Postgres instance.
#
# Usage:
#   DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
#     bash scripts/run-migrations.sh
#   DATABASE_URL=... bash scripts/run-migrations.sh down 1   # rollback N steps

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable bash scripts/run-migrations.sh" >&2
  exit 1
fi

if ! command -v migrate &> /dev/null; then
  echo "ERROR: golang-migrate CLI ('migrate') not found on PATH." >&2
  echo "  Install: https://github.com/golang-migrate/migrate" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
MIGRATIONS_DIR="${REPO_ROOT}/database/migrations"

# Append x-migrations-table as a query param — keeps this app's migration
# state isolated from Platform App's default-named tracking table without
# touching the shared DATABASE_URL variable itself.
SEP="&"
if [[ "${DATABASE_URL}" != *"?"* ]]; then
  SEP="?"
fi
MIGRATE_DATABASE_URL="${DATABASE_URL}${SEP}x-migrations-table=customer_app_schema_migrations"

ACTION="${1:-up}"
STEPS="${2:-}"

echo "==> run-migrations.sh [action=${ACTION}]"
echo "    path:     ${MIGRATIONS_DIR}"
echo "    table:    customer_app_schema_migrations"

if [[ -n "${STEPS}" ]]; then
  migrate -path "${MIGRATIONS_DIR}" -database "${MIGRATE_DATABASE_URL}" "${ACTION}" "${STEPS}"
else
  migrate -path "${MIGRATIONS_DIR}" -database "${MIGRATE_DATABASE_URL}" "${ACTION}"
fi

echo "==> Migrations complete."
```

- [ ] **Step 2: Create `scripts/create-customer-tenants.sh`**

```bash
#!/usr/bin/env bash
# Script: create-customer-tenants.sh
# Description: Registers tenants in public.customer_tenants and creates
#              per-tenant PostgreSQL schemas via create_customer_tenant_schema(),
#              then optionally seeds data. Structural port of
#              platform-app/scripts/create-tenants.sh.
#
# Usage:
#   DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable \
#     bash scripts/create-customer-tenants.sh
#
#   DATABASE_URL=... SEED=true bash scripts/create-customer-tenants.sh
#   DATABASE_URL=... TENANTS="customer_d customer_e" bash scripts/create-customer-tenants.sh
#
# Required env vars:
#   DATABASE_URL — full Postgres connection string
#
# Optional env vars:
#   SEED     — true | false (default false)
#   TENANTS  — space-separated slugs (default: customer_a customer_b customer_c)

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "  DATABASE_URL=postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable bash scripts/create-customer-tenants.sh" >&2
  exit 1
fi

echo "==> create-customer-tenants.sh"

# ── Parse DATABASE_URL into psql connection flags ─────────────────────────────
_url="${DATABASE_URL#postgres://}"
_userpass="${_url%%@*}"
_hostdb="${_url##*@}"
_hostdb="${_hostdb%%\?*}"
_host="${_hostdb%%:*}"
_portdb="${_hostdb#*:}"
_port="${_portdb%%/*}"
_dbname="${_portdb##*/}"
_user="${_userpass%%:*}"
_password="${_userpass##*:}"

export PGPASSWORD="${_password}"
PSQL="psql -h ${_host} -p ${_port} -U ${_user} -d ${_dbname} -v ON_ERROR_STOP=1"

SEED="${SEED:-false}"
TENANTS="${TENANTS:-customer_a customer_b customer_c}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SEEDS_DIR="${REPO_ROOT}/database/seeds"

echo "--> Testing database connectivity..."
${PSQL} -c "SELECT version();" > /dev/null
echo "    Connected to ${_host}:${_port}/${_dbname}"

for SLUG in ${TENANTS}; do
  echo ""
  echo "--> Processing tenant: ${SLUG}"

  # 1. Register the tenant. Neither create_tenant_schema() (Platform App) nor
  #    create_customer_tenant_schema() (this app) inserts a registry row
  #    itself — confirmed by reading both migration functions — so this
  #    script does it explicitly. This is a correction versus Platform App's
  #    own create-tenants.sh, which has the same gap unaddressed.
  echo "    Registering tenant '${SLUG}'..."
  ${PSQL} <<-SQL
    INSERT INTO public.customer_tenants (name, slug)
    VALUES ('${SLUG}', '${SLUG}')
    ON CONFLICT (slug) DO NOTHING;
SQL

  # 2. Create schema + all 5 tables via stored procedure
  echo "    Creating schema '${SLUG}'..."
  ${PSQL} <<-SQL
    SELECT public.create_customer_tenant_schema('${SLUG}');
SQL

  echo "    Schema '${SLUG}' ready."

  # 3. Optionally seed data
  if [[ "${SEED}" == "true" ]]; then
    SEED_FILE="${SEEDS_DIR}/seed-${SLUG//_/-}.sql"
    if [[ -f "${SEED_FILE}" ]]; then
      echo "    Seeding data from ${SEED_FILE}..."
      ${PSQL} -f "${SEED_FILE}"
      echo "    Seed complete."
    else
      echo "    WARNING: No seed file found at ${SEED_FILE} — skipping seed for ${SLUG}."
    fi
  fi

done

echo ""
echo "==> All tenants processed successfully."
echo ""
echo "    Registered tenants:"
${PSQL} -c "SELECT id, name, slug, is_active, created_at FROM public.customer_tenants ORDER BY created_at;"
```

- [ ] **Step 3: Make both scripts executable and verify syntax**

Run:
```bash
chmod +x customer-app/scripts/run-migrations.sh customer-app/scripts/create-customer-tenants.sh
bash -n customer-app/scripts/run-migrations.sh
bash -n customer-app/scripts/create-customer-tenants.sh
```
Expected: both `bash -n` calls exit 0 with no output (syntax-only check, doesn't execute).

- [ ] **Step 4: Commit**

```bash
git add customer-app/scripts
git commit -m "feat: customer-app migration runner and tenant creation script"
```

---

### Task 5: Seed data

**Files:**
- Create: `customer-app/database/seeds/seed-customer-a.sql`
- Create: `customer-app/database/seeds/seed-customer-b.sql`
- Create: `customer-app/database/seeds/seed-customer-c.sql`

**Interfaces:**
- Produces: three SQL files consumed by `create-customer-tenants.sh` (Task 4) when run with `SEED=true` — no other task depends on them.

Minimal fixtures per the schema built by `create_customer_tenant_schema()` (§7c/§7d of the split notes, and the migration file itself): `restaurants` → `menu_items` → `orders` → `deliveries`/`payments`, with FKs `menu_items.restaurant_id`, `orders.restaurant_id`, `deliveries.order_id`, `payments.order_id`. Each file runs with its own schema already on `search_path` — `create-customer-tenants.sh` invokes `psql -f` against the same connection that already ran `create_customer_tenant_schema('${SLUG}')`, but a fresh `psql` session doesn't retain `search_path` from a prior invocation, so each seed file sets it explicitly at the top. IDs are threaded through the file using `psql` `\gset` to capture generated UUIDs into psql variables, avoiding hardcoded UUID literals.

- [ ] **Step 1: Create `database/seeds/seed-customer-a.sql`**

```sql
-- Seed data for tenant customer_a — minimal fixtures across all 5 tables,
-- enough to prove multi-tenant isolation and exercise every payment status.
SET search_path TO customer_a, public;

-- ── Restaurants + menu items ────────────────────────────────────────────────
INSERT INTO restaurants (name, cuisine) VALUES ('Tandoor House', 'Indian') RETURNING id AS restaurant_1_id \gset
INSERT INTO restaurants (name, cuisine) VALUES ('Pasta Corner', 'Italian') RETURNING id AS restaurant_2_id \gset

INSERT INTO menu_items (restaurant_id, name, price) VALUES
    (:'restaurant_1_id', 'Butter Chicken', 14.50),
    (:'restaurant_1_id', 'Garlic Naan', 3.50),
    (:'restaurant_2_id', 'Margherita Pizza', 12.00),
    (:'restaurant_2_id', 'Spaghetti Carbonara', 13.50);

-- ── Orders (mixed status) ───────────────────────────────────────────────────
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Asha Rao', '[{"name":"Butter Chicken","qty":1}]', 'delivered', 14.50)
    RETURNING id AS order_1_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_2_id', 'Marco Bianchi', '[{"name":"Margherita Pizza","qty":1}]', 'out_for_delivery', 12.00)
    RETURNING id AS order_2_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Priya Nair', '[{"name":"Garlic Naan","qty":2}]', 'preparing', 7.00)
    RETURNING id AS order_3_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_2_id', 'Luca Conti', '[{"name":"Spaghetti Carbonara","qty":1}]', 'cancelled', 13.50)
    RETURNING id AS order_4_id \gset

-- ── Deliveries (one per non-cancelled order) ────────────────────────────────
INSERT INTO deliveries (order_id, rider_name, status) VALUES
    (:'order_1_id', 'Ravi Kumar', 'delivered'),
    (:'order_2_id', 'Giulia Ferrari', 'in_transit'),
    (:'order_3_id', 'Sana Sheikh', 'assigned');

-- ── Payments (one per order, status matching order lifecycle) ──────────────
INSERT INTO payments (order_id, amount, status, payment_method) VALUES
    (:'order_1_id', 14.50, 'completed', 'mock'),
    (:'order_2_id', 12.00, 'completed', 'mock'),
    (:'order_3_id', 7.00, 'pending', 'mock'),
    (:'order_4_id', 13.50, 'failed', 'mock');
```

- [ ] **Step 2: Create `database/seeds/seed-customer-b.sql`**

```sql
-- Seed data for tenant customer_b — different restaurant set, proves
-- cross-tenant isolation when compared against customer_a's data.
SET search_path TO customer_b, public;

INSERT INTO restaurants (name, cuisine) VALUES ('Sushi Stop', 'Japanese') RETURNING id AS restaurant_1_id \gset

INSERT INTO menu_items (restaurant_id, name, price) VALUES
    (:'restaurant_1_id', 'Salmon Nigiri (6pc)', 11.00),
    (:'restaurant_1_id', 'California Roll', 9.50),
    (:'restaurant_1_id', 'Miso Soup', 4.00);

INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Kenji Watanabe', '[{"name":"Salmon Nigiri (6pc)","qty":1}]', 'delivered', 11.00)
    RETURNING id AS order_1_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Emma Clarke', '[{"name":"California Roll","qty":1},{"name":"Miso Soup","qty":1}]', 'placed', 13.50)
    RETURNING id AS order_2_id \gset

INSERT INTO deliveries (order_id, rider_name, status) VALUES
    (:'order_1_id', 'Tom Nakamura', 'delivered');

INSERT INTO payments (order_id, amount, status, payment_method) VALUES
    (:'order_1_id', 11.00, 'completed', 'mock'),
    (:'order_2_id', 13.50, 'pending', 'mock');
```

- [ ] **Step 3: Create `database/seeds/seed-customer-c.sql`**

```sql
-- Seed data for tenant customer_c — smallest of the three, mirrors
-- platform-app's seed-tenant-c.sql being the minimal-fixture tenant.
SET search_path TO customer_c, public;

INSERT INTO restaurants (name, cuisine) VALUES ('Corner Deli', 'Sandwiches') RETURNING id AS restaurant_1_id \gset

INSERT INTO menu_items (restaurant_id, name, price) VALUES
    (:'restaurant_1_id', 'Turkey Club', 8.50);

INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Sam Okafor', '[{"name":"Turkey Club","qty":1}]', 'delivered', 8.50)
    RETURNING id AS order_1_id \gset

INSERT INTO deliveries (order_id, rider_name, status) VALUES
    (:'order_1_id', 'Dana Osei', 'delivered');

INSERT INTO payments (order_id, amount, status, payment_method) VALUES
    (:'order_1_id', 8.50, 'completed', 'mock');
```

- [ ] **Step 4: Review against schema**

Read `customer-app/database/migrations/000002_customer_tenant_schema_function.up.sql` again side-by-side with all three seed files and confirm: every column referenced exists on the table it's inserted into, every FK reference (`menu_items.restaurant_id`, `orders.restaurant_id`, `deliveries.order_id`, `payments.order_id`) points at an `id` captured earlier in the same file via `\gset`, and every `status` value used is inside that table's `CHECK` constraint list. (Live execution against Postgres is explicitly out of scope for this plan — see Task 6's deployment guide, which documents running these for real as a manual next step.)

- [ ] **Step 5: Commit**

```bash
git add customer-app/database/seeds
git commit -m "feat: add minimal seed data for customer_a/b/c tenants"
```

---

### Task 6: Helm chart — Chart.yaml, values.yaml, values-qa.yaml

**Files:**
- Create: `customer-app/infra/helm/customer-app/Chart.yaml`
- Create: `customer-app/infra/helm/customer-app/values.yaml`
- Create: `customer-app/infra/helm/customer-app/values-qa.yaml`

**Interfaces:**
- Produces: the full `.Values` tree (`global.*`, `orderService.*`, `catalogService.*`, `deliveryService.*`, `paymentService.*`, `redis.*`) — consumed by Task 7 and Task 8's templates by exact key path.

- [ ] **Step 1: Create `Chart.yaml`**

```yaml
apiVersion: v2
name: customer-app
description: Customer App — multi-tenant food-delivery demo observed by Platform App
type: application
version: 0.1.0
appVersion: "0.1.0"
```

- [ ] **Step 2: Create `values.yaml`** (env-agnostic defaults for `ENV=dev`)

```yaml
# values.yaml — default values for ENV=dev
# Override with values-qa.yaml for ENV=qa.
# Secrets (DATABASE_URL, REDIS_URL) are NEVER stored here — inject via K8s Secret.

global:
  env: dev
  namespace: customer-app-dev
  imageRegistry: "preet2fun/"
  # Cross-namespace, in-cluster DNS — same short form (service.namespace:port,
  # no .svc.cluster.local suffix) itsm-app's own values.yaml uses for its
  # own pods, just reaching from customer-app-dev into itsm-dev.
  otelCollectorEndpoint: "otel-collector.itsm-dev:4317"

# ── Order Service (Go) ──────────────────────────────────────────────────────
orderService:
  enabled: true
  name: order-service
  image:
    repository: order-service
    tag: "v0.1.0"
    pullPolicy: IfNotPresent
  port: 8080
  replicas: 1
  secretName: customer-app-secrets
  env:
    ENV: "dev"
    ORDER_SERVICE_PORT: "8080"
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 300m
      memory: 256Mi
  hpa:
    minReplicas: 1
    maxReplicas: 2
    targetCPUUtilizationPercentage: 70
  readinessProbe:
    path: /api/v1/health
    initialDelaySeconds: 5
    periodSeconds: 10
  livenessProbe:
    path: /api/v1/health
    initialDelaySeconds: 15
    periodSeconds: 20

# ── Catalog Service (Python) ────────────────────────────────────────────────
catalogService:
  enabled: true
  name: catalog-service
  image:
    repository: catalog-service
    tag: "v0.1.0"
    pullPolicy: IfNotPresent
  port: 8000
  replicas: 1
  secretName: customer-app-secrets
  env:
    ENV: "dev"
    CATALOG_SERVICE_PORT: "8000"
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 300m
      memory: 256Mi
  hpa:
    minReplicas: 1
    maxReplicas: 2
    targetCPUUtilizationPercentage: 70
  readinessProbe:
    path: /api/v1/health
    initialDelaySeconds: 5
    periodSeconds: 10
  livenessProbe:
    path: /api/v1/health
    initialDelaySeconds: 15
    periodSeconds: 20

# ── Delivery Service (Java) ─────────────────────────────────────────────────
deliveryService:
  enabled: true
  name: delivery-service
  image:
    repository: delivery-service
    tag: "v0.1.0"
    pullPolicy: IfNotPresent
  port: 8080
  replicas: 1
  secretName: customer-app-secrets
  env:
    DELIVERY_SERVICE_PORT: "8080"
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 300m
      memory: 256Mi
  hpa:
    minReplicas: 1
    maxReplicas: 2
    targetCPUUtilizationPercentage: 70
  readinessProbe:
    path: /api/v1/health
    initialDelaySeconds: 15
    periodSeconds: 10
  livenessProbe:
    path: /api/v1/health
    initialDelaySeconds: 30
    periodSeconds: 20

# ── Payment Service (Java) ──────────────────────────────────────────────────
paymentService:
  enabled: true
  name: payment-service
  image:
    repository: payment-service
    tag: "v0.1.0"
    pullPolicy: IfNotPresent
  port: 8080
  replicas: 1
  secretName: customer-app-secrets
  env:
    PAYMENT_SERVICE_PORT: "8080"
  resources:
    requests:
      cpu: 100m
      memory: 128Mi
    limits:
      cpu: 300m
      memory: 256Mi
  hpa:
    minReplicas: 1
    maxReplicas: 2
    targetCPUUtilizationPercentage: 70
  readinessProbe:
    path: /api/v1/health
    initialDelaySeconds: 15
    periodSeconds: 10
  livenessProbe:
    path: /api/v1/health
    initialDelaySeconds: 30
    periodSeconds: 20

# ── Redis (dedicated to customer-app) ───────────────────────────────────────
redis:
  enabled: true
  name: redis
  image: redis:7-alpine
  port: 6379
  persistence:
    size: 1Gi
    storageClass: local-path
  resources:
    requests:
      cpu: 50m
      memory: 64Mi
    limits:
      cpu: 200m
      memory: 256Mi
```

Note on probe timing: the two JVM services get longer `initialDelaySeconds` (15s readiness / 30s liveness) than the Go/Python services (5s/15s) — a JVM cold start (class loading + Spring context init) is slower than a Go binary or a Python/uvicorn process, and probing too early would flap the pod through repeated not-ready states during normal startup.

- [ ] **Step 3: Create `values-qa.yaml`**

```yaml
# values-qa.yaml — overrides for ENV=qa. Same resource envelope as dev
# (cluster budget doesn't grow for qa), different namespace + OTel endpoint.

global:
  env: qa
  namespace: customer-app-qa
  otelCollectorEndpoint: "otel-collector.itsm-qa:4317"

orderService:
  env:
    ENV: "qa"

catalogService:
  env:
    ENV: "qa"
```

- [ ] **Step 4: Verify values parse as valid YAML**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('customer-app/infra/helm/customer-app/Chart.yaml'))"
python3 -c "import yaml; yaml.safe_load(open('customer-app/infra/helm/customer-app/values.yaml'))"
python3 -c "import yaml; yaml.safe_load(open('customer-app/infra/helm/customer-app/values-qa.yaml'))"
```
Expected: all three exit 0, no output.

- [ ] **Step 5: Commit**

```bash
git add customer-app/infra/helm/customer-app/Chart.yaml customer-app/infra/helm/customer-app/values.yaml customer-app/infra/helm/customer-app/values-qa.yaml
git commit -m "feat: customer-app Helm chart core (Chart.yaml, values)"
```

---

### Task 7: Helm templates — order-service and catalog-service

**Files:**
- Create: `customer-app/infra/helm/customer-app/templates/order-service/deployment.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/order-service/service.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/order-service/hpa.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/catalog-service/deployment.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/catalog-service/service.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/catalog-service/hpa.yaml`

**Interfaces:**
- Consumes: `.Values.orderService.*`, `.Values.catalogService.*`, `.Values.global.*` (Task 6).
- Produces: `Deployment/order-service`, `Service/order-service`, `HorizontalPodAutoscaler/order-service-hpa` (same names for catalog-service) in `.Values.global.namespace` — consumed by Task 9's `helm template` validation.

Both services' Dockerfiles run as a fixed UID 65532 (`gcr.io/distroless/static:nonroot` for order-service, `--uid 65532` for catalog-service — confirmed by reading both Dockerfiles), matching Platform App's Go/Python services exactly, so their K8s `securityContext` can use the full `readOnlyRootFilesystem: true` + `runAsUser: 65532` pattern from `itsm-app`'s `user-service` template unchanged.

- [ ] **Step 1: Create `templates/order-service/deployment.yaml`**

```yaml
{{- if .Values.orderService.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.orderService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.orderService.name }}
    version: v1
    app.kubernetes.io/name: {{ .Values.orderService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  replicas: {{ .Values.orderService.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.orderService.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.orderService.name }}
        version: v1
        environment: {{ .Values.global.env }}
      annotations:
        sidecar.istio.io/inject: "true"
        checksum/secret: {{ .Values.orderService.secretName | sha256sum }}
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: {{ .Values.orderService.name }}
      containers:
        - name: order-service
          image: "{{ .Values.global.imageRegistry }}{{ .Values.orderService.image.repository }}:{{ .Values.orderService.image.tag }}"
          imagePullPolicy: {{ .Values.orderService.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.orderService.port }}
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.orderService.secretName }}
                  key: database-url
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.global.otelCollectorEndpoint | quote }}
            - name: OTEL_SERVICE_NAME
              value: {{ .Values.orderService.name | quote }}
            {{- range $k, $v := .Values.orderService.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          readinessProbe:
            httpGet:
              path: {{ .Values.orderService.readinessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.orderService.readinessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.orderService.readinessProbe.periodSeconds }}
          livenessProbe:
            httpGet:
              path: {{ .Values.orderService.livenessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.orderService.livenessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.orderService.livenessProbe.periodSeconds }}
          resources:
            requests:
              cpu: {{ .Values.orderService.resources.requests.cpu }}
              memory: {{ .Values.orderService.resources.requests.memory }}
            limits:
              cpu: {{ .Values.orderService.resources.limits.cpu }}
              memory: {{ .Values.orderService.resources.limits.memory }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 65532
            capabilities:
              drop:
                - ALL
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
{{- end }}
```

- [ ] **Step 2: Create `templates/order-service/service.yaml`**

```yaml
{{- if .Values.orderService.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.orderService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.orderService.name }}
    app.kubernetes.io/name: {{ .Values.orderService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  type: ClusterIP
  selector:
    app: {{ .Values.orderService.name }}
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
{{- end }}
```

- [ ] **Step 3: Create `templates/order-service/hpa.yaml`**

```yaml
{{- if .Values.orderService.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.orderService.name }}-hpa
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.orderService.name }}
    environment: {{ .Values.global.env }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.orderService.name }}
  minReplicas: {{ .Values.orderService.hpa.minReplicas }}
  maxReplicas: {{ .Values.orderService.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.orderService.hpa.targetCPUUtilizationPercentage }}
{{- end }}
```

- [ ] **Step 4: Create `templates/catalog-service/deployment.yaml`**

```yaml
{{- if .Values.catalogService.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.catalogService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.catalogService.name }}
    version: v1
    app.kubernetes.io/name: {{ .Values.catalogService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  replicas: {{ .Values.catalogService.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.catalogService.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.catalogService.name }}
        version: v1
        environment: {{ .Values.global.env }}
      annotations:
        sidecar.istio.io/inject: "true"
        checksum/secret: {{ .Values.catalogService.secretName | sha256sum }}
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: {{ .Values.catalogService.name }}
      containers:
        - name: catalog-service
          image: "{{ .Values.global.imageRegistry }}{{ .Values.catalogService.image.repository }}:{{ .Values.catalogService.image.tag }}"
          imagePullPolicy: {{ .Values.catalogService.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.catalogService.port }}
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.catalogService.secretName }}
                  key: database-url
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.catalogService.secretName }}
                  key: redis-url
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.global.otelCollectorEndpoint | quote }}
            - name: OTEL_SERVICE_NAME
              value: {{ .Values.catalogService.name | quote }}
            {{- range $k, $v := .Values.catalogService.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          readinessProbe:
            httpGet:
              path: {{ .Values.catalogService.readinessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.catalogService.readinessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.catalogService.readinessProbe.periodSeconds }}
          livenessProbe:
            httpGet:
              path: {{ .Values.catalogService.livenessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.catalogService.livenessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.catalogService.livenessProbe.periodSeconds }}
          resources:
            requests:
              cpu: {{ .Values.catalogService.resources.requests.cpu }}
              memory: {{ .Values.catalogService.resources.requests.memory }}
            limits:
              cpu: {{ .Values.catalogService.resources.limits.cpu }}
              memory: {{ .Values.catalogService.resources.limits.memory }}
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            runAsUser: 65532
            capabilities:
              drop:
                - ALL
      securityContext:
        runAsNonRoot: true
        runAsUser: 65532
{{- end }}
```

- [ ] **Step 5: Create `templates/catalog-service/service.yaml`**

```yaml
{{- if .Values.catalogService.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.catalogService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.catalogService.name }}
    app.kubernetes.io/name: {{ .Values.catalogService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  type: ClusterIP
  selector:
    app: {{ .Values.catalogService.name }}
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
{{- end }}
```

- [ ] **Step 6: Create `templates/catalog-service/hpa.yaml`**

```yaml
{{- if .Values.catalogService.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.catalogService.name }}-hpa
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.catalogService.name }}
    environment: {{ .Values.global.env }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.catalogService.name }}
  minReplicas: {{ .Values.catalogService.hpa.minReplicas }}
  maxReplicas: {{ .Values.catalogService.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.catalogService.hpa.targetCPUUtilizationPercentage }}
{{- end }}
```

- [ ] **Step 7: Commit**

```bash
git add customer-app/infra/helm/customer-app/templates/order-service customer-app/infra/helm/customer-app/templates/catalog-service
git commit -m "feat: Helm templates for order-service and catalog-service"
```

---

### Task 8: Helm templates — delivery-service, payment-service, and Redis

**Files:**
- Create: `customer-app/infra/helm/customer-app/templates/delivery-service/deployment.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/delivery-service/service.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/delivery-service/hpa.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/payment-service/deployment.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/payment-service/service.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/payment-service/hpa.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/redis/statefulset.yaml`
- Create: `customer-app/infra/helm/customer-app/templates/redis/service.yaml`

**Interfaces:**
- Consumes: `.Values.deliveryService.*`, `.Values.paymentService.*`, `.Values.redis.*`, `.Values.global.*` (Task 6).
- Produces: `Deployment/delivery-service`, `Deployment/payment-service`, their `Service`/`HorizontalPodAutoscaler`, and `StatefulSet/redis` + `Service/redis` in `.Values.global.namespace` — consumed by Task 9's `helm template` validation.

Both Java services' Dockerfiles create their non-root user via alpine's `adduser -S` (delivery-service's, and payment-service's from Task 1), which assigns a UID dynamically rather than a fixed, known one — unlike order/catalog-service's fixed UID 65532. Their `securityContext` therefore omits `runAsUser` and `readOnlyRootFilesystem` (unverified whether the JVM needs a writable path at runtime, e.g. `/tmp`, without a live test), keeping only `runAsNonRoot: true` + `allowPrivilegeEscalation: false` + dropped capabilities. This is flagged in Task 9's deployment guide as a hardening item to tighten once live-tested — the same kind of gap `itsm-app`'s frontend had before its own live-cluster fixes (nginx needed emptyDir volumes + `NET_BIND_SERVICE` under `readOnlyRootFilesystem`, discovered only by running it).

- [ ] **Step 1: Create `templates/delivery-service/deployment.yaml`**

```yaml
{{- if .Values.deliveryService.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.deliveryService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.deliveryService.name }}
    version: v1
    app.kubernetes.io/name: {{ .Values.deliveryService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  replicas: {{ .Values.deliveryService.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.deliveryService.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.deliveryService.name }}
        version: v1
        environment: {{ .Values.global.env }}
      annotations:
        sidecar.istio.io/inject: "true"
        checksum/secret: {{ .Values.deliveryService.secretName | sha256sum }}
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: {{ .Values.deliveryService.name }}
      containers:
        - name: delivery-service
          image: "{{ .Values.global.imageRegistry }}{{ .Values.deliveryService.image.repository }}:{{ .Values.deliveryService.image.tag }}"
          imagePullPolicy: {{ .Values.deliveryService.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.deliveryService.port }}
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.deliveryService.secretName }}
                  key: database-url
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.global.otelCollectorEndpoint | quote }}
            {{- range $k, $v := .Values.deliveryService.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          readinessProbe:
            httpGet:
              path: {{ .Values.deliveryService.readinessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.deliveryService.readinessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.deliveryService.readinessProbe.periodSeconds }}
          livenessProbe:
            httpGet:
              path: {{ .Values.deliveryService.livenessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.deliveryService.livenessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.deliveryService.livenessProbe.periodSeconds }}
          resources:
            requests:
              cpu: {{ .Values.deliveryService.resources.requests.cpu }}
              memory: {{ .Values.deliveryService.resources.requests.memory }}
            limits:
              cpu: {{ .Values.deliveryService.resources.limits.cpu }}
              memory: {{ .Values.deliveryService.resources.limits.memory }}
          # No runAsUser/readOnlyRootFilesystem — this image's non-root user
          # (alpine `adduser -S`) doesn't have a fixed, known UID the way the
          # distroless/--uid=65532 Go and Python images do, and whether the
          # JVM needs a writable path at runtime hasn't been live-tested yet.
          # See the deployment guide's hardening-follow-up note.
          securityContext:
            allowPrivilegeEscalation: false
            runAsNonRoot: true
            capabilities:
              drop:
                - ALL
      securityContext:
        runAsNonRoot: true
{{- end }}
```

- [ ] **Step 2: Create `templates/delivery-service/service.yaml`**

```yaml
{{- if .Values.deliveryService.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.deliveryService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.deliveryService.name }}
    app.kubernetes.io/name: {{ .Values.deliveryService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  type: ClusterIP
  selector:
    app: {{ .Values.deliveryService.name }}
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
{{- end }}
```

- [ ] **Step 3: Create `templates/delivery-service/hpa.yaml`**

```yaml
{{- if .Values.deliveryService.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.deliveryService.name }}-hpa
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.deliveryService.name }}
    environment: {{ .Values.global.env }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.deliveryService.name }}
  minReplicas: {{ .Values.deliveryService.hpa.minReplicas }}
  maxReplicas: {{ .Values.deliveryService.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.deliveryService.hpa.targetCPUUtilizationPercentage }}
{{- end }}
```

- [ ] **Step 4: Create `templates/payment-service/deployment.yaml`**

```yaml
{{- if .Values.paymentService.enabled }}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Values.paymentService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.paymentService.name }}
    version: v1
    app.kubernetes.io/name: {{ .Values.paymentService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  replicas: {{ .Values.paymentService.replicas }}
  selector:
    matchLabels:
      app: {{ .Values.paymentService.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.paymentService.name }}
        version: v1
        environment: {{ .Values.global.env }}
      annotations:
        sidecar.istio.io/inject: "true"
        checksum/secret: {{ .Values.paymentService.secretName | sha256sum }}
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: {{ .Values.paymentService.name }}
      containers:
        - name: payment-service
          image: "{{ .Values.global.imageRegistry }}{{ .Values.paymentService.image.repository }}:{{ .Values.paymentService.image.tag }}"
          imagePullPolicy: {{ .Values.paymentService.image.pullPolicy }}
          ports:
            - name: http
              containerPort: {{ .Values.paymentService.port }}
              protocol: TCP
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.paymentService.secretName }}
                  key: database-url
            - name: OTEL_EXPORTER_OTLP_ENDPOINT
              value: {{ .Values.global.otelCollectorEndpoint | quote }}
            {{- range $k, $v := .Values.paymentService.env }}
            - name: {{ $k }}
              value: {{ $v | quote }}
            {{- end }}
          readinessProbe:
            httpGet:
              path: {{ .Values.paymentService.readinessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.paymentService.readinessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.paymentService.readinessProbe.periodSeconds }}
          livenessProbe:
            httpGet:
              path: {{ .Values.paymentService.livenessProbe.path }}
              port: http
            initialDelaySeconds: {{ .Values.paymentService.livenessProbe.initialDelaySeconds }}
            periodSeconds: {{ .Values.paymentService.livenessProbe.periodSeconds }}
          resources:
            requests:
              cpu: {{ .Values.paymentService.resources.requests.cpu }}
              memory: {{ .Values.paymentService.resources.requests.memory }}
            limits:
              cpu: {{ .Values.paymentService.resources.limits.cpu }}
              memory: {{ .Values.paymentService.resources.limits.memory }}
          securityContext:
            allowPrivilegeEscalation: false
            runAsNonRoot: true
            capabilities:
              drop:
                - ALL
      securityContext:
        runAsNonRoot: true
{{- end }}
```

- [ ] **Step 5: Create `templates/payment-service/service.yaml`**

```yaml
{{- if .Values.paymentService.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.paymentService.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.paymentService.name }}
    app.kubernetes.io/name: {{ .Values.paymentService.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  type: ClusterIP
  selector:
    app: {{ .Values.paymentService.name }}
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
{{- end }}
```

- [ ] **Step 6: Create `templates/payment-service/hpa.yaml`**

```yaml
{{- if .Values.paymentService.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ .Values.paymentService.name }}-hpa
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.paymentService.name }}
    environment: {{ .Values.global.env }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ .Values.paymentService.name }}
  minReplicas: {{ .Values.paymentService.hpa.minReplicas }}
  maxReplicas: {{ .Values.paymentService.hpa.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.paymentService.hpa.targetCPUUtilizationPercentage }}
{{- end }}
```

- [ ] **Step 7: Create `templates/redis/statefulset.yaml`**

```yaml
{{- if .Values.redis.enabled }}
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: {{ .Values.redis.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.redis.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  serviceName: {{ .Values.redis.name }}
  replicas: 1
  selector:
    matchLabels:
      app: {{ .Values.redis.name }}
  template:
    metadata:
      labels:
        app: {{ .Values.redis.name }}
        environment: {{ .Values.global.env }}
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 999   # redis user in official image
        fsGroup: 999
      containers:
        - name: redis
          image: {{ .Values.redis.image }}
          imagePullPolicy: IfNotPresent
          command:
            - redis-server
            - --appendonly
            - "yes"
            - --appendfsync
            - everysec
          ports:
            - name: redis
              containerPort: {{ .Values.redis.port }}
          resources:
            requests:
              cpu: {{ .Values.redis.resources.requests.cpu }}
              memory: {{ .Values.redis.resources.requests.memory }}
            limits:
              cpu: {{ .Values.redis.resources.limits.cpu }}
              memory: {{ .Values.redis.resources.limits.memory }}
          readinessProbe:
            exec:
              command: ["redis-cli", "ping"]
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            exec:
              command: ["redis-cli", "ping"]
            initialDelaySeconds: 15
            periodSeconds: 20
          volumeMounts:
            - name: redis-data
              mountPath: /data
  volumeClaimTemplates:
    - metadata:
        name: redis-data
      spec:
        accessModes: ["ReadWriteOnce"]
        storageClassName: {{ .Values.redis.persistence.storageClass }}
        resources:
          requests:
            storage: {{ .Values.redis.persistence.size }}
{{- end }}
```

- [ ] **Step 8: Create `templates/redis/service.yaml`**

```yaml
{{- if .Values.redis.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ .Values.redis.name }}
  namespace: {{ .Values.global.namespace }}
  labels:
    app: {{ .Values.redis.name }}
    app.kubernetes.io/part-of: customer-app
    environment: {{ .Values.global.env }}
spec:
  clusterIP: None
  selector:
    app: {{ .Values.redis.name }}
  ports:
    - name: redis
      port: {{ .Values.redis.port }}
      targetPort: redis
{{- end }}
```

- [ ] **Step 9: Commit**

```bash
git add customer-app/infra/helm/customer-app/templates/delivery-service customer-app/infra/helm/customer-app/templates/payment-service customer-app/infra/helm/customer-app/templates/redis
git commit -m "feat: Helm templates for delivery-service, payment-service, and Redis"
```

---

### Task 9: Helm chart validation, K8s namespaces, and secret documentation

**Files:**
- Create: `customer-app/infra/k8s/namespaces/dev/namespace-customer-app-dev.yaml`
- Create: `customer-app/infra/k8s/namespaces/qa/namespace-customer-app-qa.yaml`

**Interfaces:**
- Consumes: the complete chart from Tasks 6-8.
- Produces: nothing consumed by later tasks — this is the chart's final validation gate before Task 11's deployment guide references it as ready.

- [ ] **Step 1: Create `infra/k8s/namespaces/dev/namespace-customer-app-dev.yaml`**

```yaml
# Namespace: customer-app-dev
# Hosts all 4 Customer App services + its dedicated Redis for the dev
# environment. Single shared namespace, not one per tenant — tenant
# isolation is entirely via X-Tenant-ID header -> DB schema search_path,
# which is what every service already implements in code. Matches what
# Platform App itself actually deploys (single itsm-dev namespace) rather
# than SYSTEM_PROMPT.md's aspirational per-tenant-namespace text.
# Istio sidecar injection ENABLED — all pods get Envoy proxy.

apiVersion: v1
kind: Namespace
metadata:
  name: customer-app-dev
  labels:
    env: dev
    istio-injection: enabled
```

- [ ] **Step 2: Create `infra/k8s/namespaces/qa/namespace-customer-app-qa.yaml`**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: customer-app-qa
  labels:
    env: qa
    istio-injection: enabled
```

- [ ] **Step 3: Verify namespace YAML syntax**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('customer-app/infra/k8s/namespaces/dev/namespace-customer-app-dev.yaml'))"
python3 -c "import yaml; yaml.safe_load(open('customer-app/infra/k8s/namespaces/qa/namespace-customer-app-qa.yaml'))"
```
Expected: both exit 0, no output.

- [ ] **Step 4: Lint the full Helm chart**

Run: `helm lint customer-app/infra/helm/customer-app`
Expected: `1 chart(s) linted, 0 chart(s) failed`. If it reports failures, fix the reported template/values issue before continuing — do not proceed to Step 5 with a failing lint.

- [ ] **Step 5: Render the chart for dev and inspect resource values**

Run: `helm template customer-app customer-app/infra/helm/customer-app -f customer-app/infra/helm/customer-app/values.yaml > /tmp/customer-app-dev-rendered.yaml`
Expected: exits 0, produces YAML output (no `Error:` lines).

Run: `grep -c "kind: Deployment" /tmp/customer-app-dev-rendered.yaml`
Expected: `4` (one per app service).

Run: `grep -c "kind: HorizontalPodAutoscaler" /tmp/customer-app-dev-rendered.yaml`
Expected: `4`.

Run: `grep "maxReplicas" /tmp/customer-app-dev-rendered.yaml`
Expected: every line reads `maxReplicas: 2` — confirms the HPA cap is respected everywhere, matching the Global Constraints section of this plan.

- [ ] **Step 6: Render the chart for qa and spot-check the namespace override**

Run: `helm template customer-app customer-app/infra/helm/customer-app -f customer-app/infra/helm/customer-app/values.yaml -f customer-app/infra/helm/customer-app/values-qa.yaml | grep "namespace: customer-app-qa" | wc -l`
Expected: a positive count (every namespaced resource picked up the qa override — 12 resources: 4 Deployments + 4 Services + 4 HPAs, plus the Redis StatefulSet+Service = 14 total namespaced resources).

- [ ] **Step 7: Commit**

```bash
git add customer-app/infra/k8s/namespaces
git commit -m "feat: customer-app K8s namespace manifests"
```

---

### Task 10: CI workflow updates

**Files:**
- Modify: `.github/workflows/ci-build.yml`
- Modify: `.github/workflows/ci-lint.yml`

**Interfaces:** none — this task only wires existing services into existing CI jobs.

`ci-build.yml` currently has one `docker build`-validation job per Platform App service (`user-service`, `asset-service`, `incident-service`, `frontend`) — none of customer-app's 4 services have a job yet, even the 3 already built. `ci-lint.yml` currently has per-language jobs (`lint-go`, `lint-python`, `lint-typescript`) each explicitly listing Platform App's services — same gap. **Correction to the approved spec**: `ci-docker-push.yml` was assumed to have an existing per-service push structure to extend; re-reading it shows it's currently just a tag-format placeholder ("Phase 9 will expand this into per-service matrix builds") with no per-service logic at all yet — there's nothing there to mirror for customer-app without building out Platform App's own Phase 9 CI/CD matrix prematurely, which is out of scope (`P-Phase 7`/`P-Phase 9` are still `🔲 Pending` in `CLAUDE.md`'s phase tracker). This task only touches `ci-build.yml` and `ci-lint.yml`.

- [ ] **Step 1: Add customer-app build jobs to `ci-build.yml`**

Append these 4 jobs to the end of the `jobs:` section in `.github/workflows/ci-build.yml` (after the existing `build-frontend` job):

```yaml
  build-order-service:
    name: Build order-service (Customer App)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: |
          docker build \
            -t preet2fun/order-service:ci-${{ github.sha }} \
            customer-app/services/order-service/

  build-catalog-service:
    name: Build catalog-service (Customer App)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: |
          docker build \
            -t preet2fun/catalog-service:ci-${{ github.sha }} \
            customer-app/services/catalog-service/

  build-delivery-service:
    name: Build delivery-service (Customer App)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: |
          docker build \
            -t preet2fun/delivery-service:ci-${{ github.sha }} \
            customer-app/services/delivery-service/

  build-payment-service:
    name: Build payment-service (Customer App)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: |
          docker build \
            -t preet2fun/payment-service:ci-${{ github.sha }} \
            customer-app/services/payment-service/
```

- [ ] **Step 2: Add `order-service` to the `lint-go` job in `ci-lint.yml`**

In `.github/workflows/ci-lint.yml`, inside the existing `lint-go` job, after the `golangci-lint — user-service` step, append:

```yaml
      - name: gofmt check — order-service
        run: |
          unformatted=$(gofmt -l customer-app/services/order-service/)
          if [ -n "$unformatted" ]; then
            echo "Unformatted files:"; echo "$unformatted"; exit 1
          fi
      - name: golangci-lint — order-service
        uses: golangci/golangci-lint-action@v6
        with:
          working-directory: customer-app/services/order-service
```

- [ ] **Step 3: Add `catalog-service` to the `lint-python` job in `ci-lint.yml`**

In the existing `lint-python` job, after the `ruff — incident-service` step, append:

```yaml
      - name: ruff — catalog-service
        run: ruff check customer-app/services/catalog-service/
```

- [ ] **Step 4: Verify both workflow files are still valid YAML**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-build.yml'))"
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci-lint.yml'))"
```
Expected: both exit 0, no output.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/ci-build.yml .github/workflows/ci-lint.yml
git commit -m "ci: build and lint customer-app's 4 services"
```

---

### Task 11: Deployment guide

**Files:**
- Create: `customer-app/docs/deployment-guide.md`

**Interfaces:** none — this is the final documentation task, referencing every artifact from Tasks 1-10.

Follows the shape `CLAUDE.md` requires for every deployment guide: prerequisites, ordered steps, expected output, verification queries/commands, rollback instructions, troubleshooting, and an acceptance checklist.

- [ ] **Step 1: Create `docs/deployment-guide.md`**

```markdown
# Customer App Deployment Guide

Covers deploying Customer App (order/catalog/delivery/payment services +
dedicated Redis) to the shared kubeadm cluster, for `ENV=dev` (default) or
`ENV=qa`. Nothing in this guide has been run against the live Postgres
instance or the live cluster yet — every command below is a manual next
step for whoever runs it.

## Prerequisites

- `kubectl` context pointed at the kubeadm cluster, Istio already installed
  (Customer App reuses Platform App's Istio + OTel Collector — see
  `platform-app/docs/platform/deployment-guides/Phase_06_Istio_OPA.md`)
- `helm` 3.15+
- `golang-migrate` CLI (`migrate --version`)
- `psql` client
- Docker images for all 4 services built and pushed to Docker Hub
  (`preet2fun/order-service`, `preet2fun/catalog-service`,
  `preet2fun/delivery-service`, `preet2fun/payment-service`, all tagged
  `v0.1.0` per `values.yaml`) — not done by this guide; build via
  `docker build -t preet2fun/<service>:v0.1.0 customer-app/services/<service>/`
  and `docker push` for each
- `DATABASE_URL` for the shared Postgres instance (same server Platform App
  uses — see the `[[project_database_url]]` memory / `.env`)

## Step 1 — Resource budget pre-check (required before Step 4)

Customer App's worst case (all 4 app services HPA-maxed + 1 Redis pod) adds
≈2.25Gi memory limit / ≈1.06Gi memory request to whatever Platform App + AI
Engine have already claimed on the cluster's ~10-11Gi usable workload RAM.
This was computed from the values table only — verify against live
allocatable capacity before deploying:

```bash
kubectl describe nodes | grep -A 5 "Allocated resources"
```

If the remaining headroom is under ~2.5Gi memory across the worker nodes,
stop here and either scale down something else first or reduce Customer
App's `replicas`/`hpa.maxReplicas` in `values.yaml` before proceeding.

## Step 2 — Run migrations

```bash
cd customer-app
DATABASE_URL="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable" \
  bash scripts/run-migrations.sh
```

**Expected output:** `==> Migrations complete.` with no error lines above it.

## Step 3 — Create tenants (with seed data)

```bash
DATABASE_URL="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable" \
  SEED=true bash scripts/create-customer-tenants.sh
```

**Expected output:** ends with a table listing `customer_a`, `customer_b`,
`customer_c` under "Registered tenants".

**Verification query:**
```sql
SELECT slug FROM public.customer_tenants ORDER BY slug;
-- expect: customer_a, customer_b, customer_c

SELECT COUNT(*) FROM customer_a.restaurants;  -- expect: 2
SELECT COUNT(*) FROM customer_a.payments WHERE status = 'failed';  -- expect: 1
```

## Step 4 — Create the namespace and secret

```bash
kubectl apply -f infra/k8s/namespaces/dev/namespace-customer-app-dev.yaml

kubectl create secret generic customer-app-secrets \
  --from-literal=database-url="postgres://itsm:itsm@<machine-ip>:5432/itsm?sslmode=disable" \
  --from-literal=redis-url="redis://redis.customer-app-dev:6379/0" \
  -n customer-app-dev
```

**Verification:** `kubectl get secret customer-app-secrets -n customer-app-dev -o yaml` (values are base64-encoded — that's expected).

## Step 5 — Deploy

```bash
helm install customer-app infra/helm/customer-app \
  -f infra/helm/customer-app/values.yaml \
  -n customer-app-dev
```

For QA: add `-f infra/helm/customer-app/values-qa.yaml` and target `-n customer-app-qa` (after applying `namespace-customer-app-qa.yaml` and creating the secret there too).

**Expected output:** `STATUS: deployed`, with 4 Deployments + 1 StatefulSet listed.

**Verification:**
```bash
kubectl get pods -n customer-app-dev
# expect: order-service, catalog-service, delivery-service, payment-service, redis-0 — all Running

kubectl exec -n customer-app-dev deploy/order-service -- wget -qO- localhost:8080/api/v1/health
# expect: {"status":"ok","service":"order-service"}
```

## Rollback

```bash
helm uninstall customer-app -n customer-app-dev
kubectl delete secret customer-app-secrets -n customer-app-dev
```

Migrations are not automatically rolled back — to reverse them:
```bash
DATABASE_URL="..." bash scripts/run-migrations.sh down 1
```

## Troubleshooting

- **Pods stuck in `ImagePullBackOff`:** images haven't been built/pushed yet — see Prerequisites.
- **`delivery-service`/`payment-service` pods `OOMKilled` or `CrashLoopBackOff` shortly after start:** the 128Mi/256Mi envelope was an explicit, flagged risk (see the design spec, §2/§7) — even with `-XX:MaxRAMPercentage=75.0`, a JVM has baseline overhead (metaspace, thread stacks, JIT) that can exceed this on a cold start. If this happens, the fix is raising these two services' `resources.limits.memory` in `values.yaml` (at minimum to the AI Service's 512Mi row) — this was the alternative option presented and explicitly not chosen going in, so revisit it here if the risk materializes.
- **`order-service`/`catalog-service` pods fail readiness with `readOnlyRootFilesystem` errors:** Platform App's frontend hit an identical class of issue (needed writable `emptyDir` volumes) — check pod logs for the specific path the process is trying to write to, and add a scoped `emptyDir` volume mount for just that path rather than removing `readOnlyRootFilesystem`.
- **`config: DATABASE_URL is required` in any service's logs:** the `customer-app-secrets` Secret wasn't created, or a key name doesn't match (`database-url`/`redis-url`, not `DATABASE_URL`/`REDIS_URL`).
- **Cache misses never turn into hits on `catalog-service`:** check `kubectl logs deploy/catalog-service -n customer-app-dev | grep -i redis` — cache failures are logged as warnings and treated as non-fatal (requests still succeed, just uncached), so a misconfigured `REDIS_URL` won't show up as a request failure.

## Acceptance checklist

- [ ] `kubectl get pods -n customer-app-dev` shows all 5 pods `Running` (4 app services + `redis-0`)
- [ ] All 4 `/api/v1/health` endpoints return `200` with the correct `service` name
- [ ] `SELECT * FROM customer_a.orders` (via `psql`, `search_path` set) returns the 4 seeded rows
- [ ] A `POST /api/v1/payments` with `amount: 0` via `catalog-service`'s companion `order-service` order returns `status: "failed"`; the same with a positive amount returns `"completed"`
- [ ] Two consecutive `GET /api/v1/restaurants` calls with the same `X-Tenant-ID` show a cache hit on the second (check the `customer.catalog.cache_lookup` span's `cache.hit` attribute in Jaeger, or `redis-cli -n 0 keys "customer:*"` inside the `redis-0` pod)
- [ ] A request with `X-Tenant-ID: customer_b` never returns `customer_a`'s data and vice versa
- [ ] `kubectl top pods -n customer-app-dev` (if `metrics-server` is installed) shows all pods under their memory *limit*, not just their *request*
```

- [ ] **Step 2: Commit**

```bash
git add customer-app/docs/deployment-guide.md
git commit -m "docs: customer-app deployment guide"
```

---

## Plan self-review notes

- **Spec coverage:** §2 (payment-service) → Tasks 1-2. §3 (Redis wiring) → Task 3. §4 (migration tooling) → Task 4. §5 (tenant script) → Task 4. §6 (seed data) → Task 5. §7 (Helm chart) → Tasks 6-9. §8 (K8s namespace) → Task 9. §9 (resource budget) → Task 11's deployment guide Step 1. §10 (CI) → Task 10 (with the ci-docker-push.yml correction noted inline). §11 (docs) → Tasks 2 (payment-service README) and 11 (deployment guide). §12 (non-goals) → respected throughout; no task applies anything live.
- **Type consistency:** `Payment` record fields (`id, orderId, amount, status, paymentMethod, createdAt`) match between Task 1 (definition) and Task 2 (`PaymentController`/test usage) exactly. `PaymentRepository` method signatures match between Task 1 (definition) and Task 2 (controller calls, test mocks) exactly — `create(String, UUID, BigDecimal, String, String)`, `updateStatus(String, UUID, String)`, `findById(String, UUID)`, `findByOrderId(String, UUID)`.
- **Placeholder scan:** no TBD/TODO markers; every step has literal file content.
