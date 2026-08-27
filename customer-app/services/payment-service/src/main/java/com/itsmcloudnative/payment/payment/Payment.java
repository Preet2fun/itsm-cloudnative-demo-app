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
