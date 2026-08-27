package com.itsmcloudnative.delivery.delivery;

import java.time.OffsetDateTime;
import java.util.UUID;

/** Mirrors the deliveries table created by public.create_customer_tenant_schema. */
public record Delivery(
        UUID id,
        UUID orderId,
        String riderName,
        String status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
    public static final java.util.Set<String> VALID_STATUSES =
            java.util.Set.of("assigned", "picked_up", "in_transit", "delivered", "failed");
}
