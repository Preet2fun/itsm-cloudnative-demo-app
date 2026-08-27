package com.itsmcloudnative.delivery.delivery;

import com.itsmcloudnative.delivery.tenant.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class DeliveryController {

    private final DeliveryRepository repo;

    public DeliveryController(DeliveryRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "delivery-service");
    }

    @GetMapping("/deliveries")
    public List<Delivery> listByOrder(@RequestParam UUID orderId) {
        try {
            return repo.findByOrderId(TenantContext.get(), orderId);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @PostMapping("/deliveries")
    public ResponseEntity<Delivery> create(@RequestBody CreateDeliveryRequest req) {
        if (req.orderId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "order_id is required");
        }
        try {
            Delivery created = repo.create(TenantContext.get(), req.orderId(), req.riderName());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @GetMapping("/deliveries/{id}")
    public Delivery getById(@PathVariable UUID id) {
        try {
            return repo.findById(TenantContext.get(), id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "delivery not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    @PutMapping("/deliveries/{id}/status")
    public Delivery updateStatus(@PathVariable UUID id, @RequestBody UpdateStatusRequest req) {
        if (!Delivery.VALID_STATUSES.contains(req.status())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "invalid status");
        }
        try {
            return repo.updateStatus(TenantContext.get(), id, req.status())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "delivery not found"));
        } catch (SQLException e) {
            throw internalError(e);
        }
    }

    private ResponseStatusException internalError(SQLException e) {
        return new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "internal error", e);
    }

    public record CreateDeliveryRequest(UUID orderId, String riderName) {}

    public record UpdateStatusRequest(String status) {}
}
