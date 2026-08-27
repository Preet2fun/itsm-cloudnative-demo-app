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
