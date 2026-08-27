package com.itsmcloudnative.delivery.delivery;

import org.springframework.stereotype.Repository;

import javax.sql.DataSource;
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
 * Raw-JDBC access to the deliveries table. Every method sets search_path on
 * the connection it borrows before querying — same tenant-isolation pattern
 * as order-service (Go) and catalog-service (Python), just without an ORM
 * in between.
 */
@Repository
public class DeliveryRepository {

    private static final Pattern SLUG = Pattern.compile("^[a-z][a-z0-9_]{0,62}$");

    private final DataSource dataSource;

    public DeliveryRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public List<Delivery> findByOrderId(String tenantSlug, UUID orderId) throws SQLException {
        List<Delivery> results = new ArrayList<>();
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, order_id, rider_name, status, created_at, updated_at " +
                            "FROM deliveries WHERE order_id = ? ORDER BY created_at DESC")) {
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

    public Optional<Delivery> findById(String tenantSlug, UUID id) throws SQLException {
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "SELECT id, order_id, rider_name, status, created_at, updated_at " +
                            "FROM deliveries WHERE id = ?")) {
                ps.setObject(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    return rs.next() ? Optional.of(map(rs)) : Optional.empty();
                }
            }
        }
    }

    public Delivery create(String tenantSlug, UUID orderId, String riderName) throws SQLException {
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "INSERT INTO deliveries (order_id, rider_name) VALUES (?, ?) " +
                            "RETURNING id, order_id, rider_name, status, created_at, updated_at")) {
                ps.setObject(1, orderId);
                ps.setString(2, riderName);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    return map(rs);
                }
            }
        }
    }

    public Optional<Delivery> updateStatus(String tenantSlug, UUID id, String status) throws SQLException {
        try (Connection conn = borrowTenantConnection(tenantSlug)) {
            try (PreparedStatement ps = conn.prepareStatement(
                    "UPDATE deliveries SET status = ?, updated_at = NOW() WHERE id = ? " +
                            "RETURNING id, order_id, rider_name, status, created_at, updated_at")) {
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

    private static Delivery map(ResultSet rs) throws SQLException {
        return new Delivery(
                (UUID) rs.getObject("id"),
                (UUID) rs.getObject("order_id"),
                rs.getString("rider_name"),
                rs.getString("status"),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getObject("updated_at", OffsetDateTime.class)
        );
    }
}
