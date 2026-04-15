package middleware

import (
	"context"
	"net/http"
	"regexp"
)

type contextKey int

const (
	tenantIDKey contextKey = iota
	userRoleKey
)

var slugRe = regexp.MustCompile(`^[a-z][a-z0-9_]{0,62}$`)

// TenantRequired extracts X-Tenant-ID and X-User-Role from the request headers
// (injected by Istio after JWT validation) and stores them in the context.
// Returns HTTP 400 if X-Tenant-ID is absent or malformed.
// In Phase 3 (no Istio yet), these headers must be sent manually by the caller.
func TenantRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slug := r.Header.Get("X-Tenant-ID")
		if slug == "" {
			http.Error(w, `{"error":"X-Tenant-ID header is required"}`, http.StatusBadRequest)
			return
		}
		if !slugRe.MatchString(slug) {
			http.Error(w, `{"error":"X-Tenant-ID header contains invalid characters"}`, http.StatusBadRequest)
			return
		}

		role := r.Header.Get("X-User-Role")

		ctx := context.WithValue(r.Context(), tenantIDKey, slug)
		ctx = context.WithValue(ctx, userRoleKey, role)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetTenantID retrieves the tenant slug stored by TenantRequired.
func GetTenantID(ctx context.Context) string {
	v, _ := ctx.Value(tenantIDKey).(string)
	return v
}

// GetUserRole retrieves the user role stored by TenantRequired.
func GetUserRole(ctx context.Context) string {
	v, _ := ctx.Value(userRoleKey).(string)
	return v
}
