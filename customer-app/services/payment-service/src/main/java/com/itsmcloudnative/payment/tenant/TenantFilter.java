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
