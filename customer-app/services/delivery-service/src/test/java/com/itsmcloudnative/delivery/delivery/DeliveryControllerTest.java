package com.itsmcloudnative.delivery.delivery;

import com.itsmcloudnative.delivery.tenant.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class DeliveryControllerTest {

    private DeliveryRepository repo;
    private DeliveryController controller;

    @BeforeEach
    void setUp() {
        repo = mock(DeliveryRepository.class);
        controller = new DeliveryController(repo);
        TenantContext.set("customer_a");
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_withOrderId_returnsCreated() throws Exception {
        UUID orderId = UUID.randomUUID();
        Delivery created = new Delivery(
                UUID.randomUUID(), orderId, "Alex Rider", "assigned",
                OffsetDateTime.now(), OffsetDateTime.now());
        when(repo.create(eq("customer_a"), eq(orderId), eq("Alex Rider")))
                .thenReturn(created);

        ResponseEntity<Delivery> response =
                controller.create(new DeliveryController.CreateDeliveryRequest(orderId, "Alex Rider"));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().status()).isEqualTo("assigned");
    }

    @Test
    void create_withNullOrderId_isRejected() {
        assertThatThrownBy(() ->
                controller.create(new DeliveryController.CreateDeliveryRequest(null, "Alex Rider")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
    }

    @Test
    void getById_whenFound_returnsDelivery() throws Exception {
        UUID id = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        Delivery existing = new Delivery(
                id, orderId, "Alex Rider", "in_transit",
                OffsetDateTime.now(), OffsetDateTime.now());
        when(repo.findById("customer_a", id)).thenReturn(Optional.of(existing));

        Delivery result = controller.getById(id);

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.status()).isEqualTo("in_transit");
    }

    @Test
    void getById_whenNotFound_isRejected() throws Exception {
        UUID id = UUID.randomUUID();
        when(repo.findById("customer_a", id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getById(id))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }

    @Test
    void listByOrder_returnsDeliveriesForOrder() throws Exception {
        UUID orderId = UUID.randomUUID();
        Delivery d1 = new Delivery(
                UUID.randomUUID(), orderId, "Alex Rider", "delivered",
                OffsetDateTime.now(), OffsetDateTime.now());
        when(repo.findByOrderId("customer_a", orderId)).thenReturn(List.of(d1));

        List<Delivery> results = controller.listByOrder(orderId);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).orderId()).isEqualTo(orderId);
    }

    @Test
    void updateStatus_withValidStatus_isAllowed() throws Exception {
        UUID id = UUID.randomUUID();
        UUID orderId = UUID.randomUUID();
        Delivery updated = new Delivery(
                id, orderId, "Alex Rider", "picked_up",
                OffsetDateTime.now(), OffsetDateTime.now());
        when(repo.updateStatus("customer_a", id, "picked_up"))
                .thenReturn(Optional.of(updated));

        Delivery result = controller.updateStatus(id, new DeliveryController.UpdateStatusRequest("picked_up"));

        assertThat(result.status()).isEqualTo("picked_up");
    }

    @Test
    void updateStatus_withInvalidStatus_isRejected() {
        UUID id = UUID.randomUUID();

        assertThatThrownBy(() ->
                controller.updateStatus(id, new DeliveryController.UpdateStatusRequest("bogus_status")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("400");
    }

    @Test
    void updateStatus_whenDeliveryNotFound_isRejected() throws Exception {
        UUID id = UUID.randomUUID();
        when(repo.updateStatus("customer_a", id, "delivered")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                controller.updateStatus(id, new DeliveryController.UpdateStatusRequest("delivered")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("404");
    }
}
