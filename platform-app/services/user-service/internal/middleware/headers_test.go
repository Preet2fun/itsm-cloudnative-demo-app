package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

// These tests need no database or Redis — TenantRequired is pure HTTP
// middleware. Final-review finding I3: this file previously didn't exist,
// so the only two pieces of security logic in this plan that could have
// been proven without live infrastructure had zero test coverage.

func serve(t *testing.T, tenantHeader, roleHeader string) (*httptest.ResponseRecorder, string, string) {
	t.Helper()
	var gotTenant, gotRole string
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotTenant = GetTenantID(r.Context())
		gotRole = GetUserRole(r.Context())
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/users", nil)
	if tenantHeader != "" {
		req.Header.Set("X-Tenant-ID", tenantHeader)
	}
	if roleHeader != "" {
		req.Header.Set("X-User-Role", roleHeader)
	}
	w := httptest.NewRecorder()
	TenantRequired(next).ServeHTTP(w, req)
	return w, gotTenant, gotRole
}

func TestTenantRequired_AbsentHeaderIsValid(t *testing.T) {
	w, gotTenant, gotRole := serve(t, "", "platform_admin")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200 (absent X-Tenant-ID must not be rejected)", w.Code)
	}
	if gotTenant != "" {
		t.Errorf("GetTenantID() = %q, want \"\"", gotTenant)
	}
	if gotRole != "platform_admin" {
		t.Errorf("GetUserRole() = %q, want platform_admin", gotRole)
	}
}

func TestTenantRequired_MalformedHeaderRejected(t *testing.T) {
	w, _, _ := serve(t, "Not A Valid Slug!!", "agent")
	if w.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want 400 for a malformed X-Tenant-ID", w.Code)
	}
}

func TestTenantRequired_ValidHeaderPassesThrough(t *testing.T) {
	w, gotTenant, gotRole := serve(t, "customer_a", "agent")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if gotTenant != "customer_a" {
		t.Errorf("GetTenantID() = %q, want customer_a", gotTenant)
	}
	if gotRole != "agent" {
		t.Errorf("GetUserRole() = %q, want agent", gotRole)
	}
}

func TestTenantRequired_NoRoleHeaderStillPassesThrough(t *testing.T) {
	// TenantRequired itself does not enforce role — that's callerCanAccess's
	// job, downstream, once both tenant and role are available together.
	w, gotTenant, gotRole := serve(t, "", "")
	if w.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", w.Code)
	}
	if gotTenant != "" || gotRole != "" {
		t.Errorf("got tenant=%q role=%q, want both empty", gotTenant, gotRole)
	}
}
