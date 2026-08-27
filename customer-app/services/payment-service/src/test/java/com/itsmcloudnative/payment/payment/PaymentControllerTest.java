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
