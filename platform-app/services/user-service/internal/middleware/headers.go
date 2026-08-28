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
//
// X-Tenant-ID is optional, not required, despite the name (kept for
// backwards compatibility with existing call sites) — a platform-staff
// caller's JWT has no tenant_id claim, so Istio legitimately sends no
// X-Tenant-ID header at all for them (confirmed: Istio's outputClaimToHeaders
// simply omits the header when the source claim doesn't exist). Only a
// header that IS present but malformed is rejected.
func TenantRequired(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		slug := r.Header.Get("X-Tenant-ID")
		if slug != "" && !slugRe.MatchString(slug) {
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
// Returns "" for a platform-staff caller (no tenant_id claim on their JWT).
func GetTenantID(ctx context.Context) string {
	v, _ := ctx.Value(tenantIDKey).(string)
	return v
}

// GetUserRole retrieves the user role stored by TenantRequired.
func GetUserRole(ctx context.Context) string {
	v, _ := ctx.Value(userRoleKey).(string)
	return v
}
