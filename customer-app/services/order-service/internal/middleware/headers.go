package middleware

import (
	"context"
	"net/http"
	"regexp"
)

type contextKey int

const tenantIDKey contextKey = iota

var slugRe = regexp.MustCompile(`^[a-z][a-z0-9_]{0,62}$`)

// TenantRequired extracts X-Tenant-ID from the request headers and stores it
// in the context. Returns HTTP 400 if the header is absent or malformed.
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

		ctx := context.WithValue(r.Context(), tenantIDKey, slug)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetTenantID retrieves the tenant slug stored by TenantRequired.
func GetTenantID(ctx context.Context) string {
	v, _ := ctx.Value(tenantIDKey).(string)
	return v
}
