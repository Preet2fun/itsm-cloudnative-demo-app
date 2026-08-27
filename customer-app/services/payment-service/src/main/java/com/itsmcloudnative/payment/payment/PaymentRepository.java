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
