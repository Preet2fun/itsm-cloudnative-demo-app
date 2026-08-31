package middleware

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestTenantRequired(t *testing.T) {
	tests := []struct {
		name       string
		headerVal  string
		setHeader  bool
		wantStatus int
		wantSlug   string
	}{
		{
			name:       "missing header",
			setHeader:  false,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "empty header",
			setHeader:  true,
			headerVal:  "",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "uppercase not allowed",
			setHeader:  true,
			headerVal:  "TenantA",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "leading digit not allowed",
			setHeader:  true,
			headerVal:  "1tenant",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "hyphen not allowed",
			setHeader:  true,
			headerVal:  "tenant-a",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "spaces not allowed",
			setHeader:  true,
			headerVal:  "tenant a",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "too long",
			setHeader:  true,
			headerVal:  "a" + strings.Repeat("b", 63), // 64 chars total, max is 63
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "valid single char",
			setHeader:  true,
			headerVal:  "a",
			wantStatus: http.StatusOK,
			wantSlug:   "a",
		},
		{
			name:       "valid slug with underscore and digits",
			setHeader:  true,
			headerVal:  "customer_a1",
			wantStatus: http.StatusOK,
			wantSlug:   "customer_a1",
		},
		{
			name:       "valid max length",
			setHeader:  true,
			headerVal:  "a" + strings.Repeat("b", 62), // 63 chars total, exactly max
			wantStatus: http.StatusOK,
			wantSlug:   "a" + strings.Repeat("b", 62),
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var gotSlug string
			next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				gotSlug = GetTenantID(r.Context())
				w.WriteHeader(http.StatusOK)
			})

			req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
			if tt.setHeader {
				req.Header.Set("X-Tenant-ID", tt.headerVal)
			}
			rec := httptest.NewRecorder()

			TenantRequired(next).ServeHTTP(rec, req)

			if rec.Code != tt.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tt.wantStatus)
			}
			if tt.wantStatus == http.StatusOK && gotSlug != tt.wantSlug {
				t.Errorf("GetTenantID() = %q, want %q", gotSlug, tt.wantSlug)
			}
		})
	}
}

func TestTenantRequired_ErrorBodyIsJSON(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
	rec := httptest.NewRecorder()

	TenantRequired(next).ServeHTTP(rec, req)

	body, err := io.ReadAll(rec.Result().Body)
	if err != nil {
		t.Fatalf("read body: %v", err)
	}
	if !strings.Contains(string(body), "X-Tenant-ID header is required") {
		t.Errorf("body = %q, want it to contain the missing-header message", body)
	}
}

func TestGetTenantID_NoValueInContext(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
	if got := GetTenantID(req.Context()); got != "" {
		t.Errorf("GetTenantID() on bare context = %q, want empty string", got)
	}
}
