package sessionstore

import (
	"context"
	"os"
	"testing"
	"time"
)

func testStore(t *testing.T) *Store {
	t.Helper()
	url := os.Getenv("REDIS_URL")
	if url == "" {
		t.Skip("REDIS_URL not set — skipping sessionstore integration test")
	}
	s, err := New(url)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestSaveAndGetSession(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()
	sessionID := "test-session-" + t.Name()

	if err := s.SaveSession(ctx, sessionID, "user-123", "tenant_a", time.Minute); err != nil {
		t.Fatalf("SaveSession() error = %v", err)
	}
	t.Cleanup(func() { s.DeleteSession(ctx, sessionID) })

	userID, tenantSlug, err := s.GetSession(ctx, sessionID)
	if err != nil {
		t.Fatalf("GetSession() error = %v", err)
	}
	if userID != "user-123" || tenantSlug != "tenant_a" {
		t.Errorf("GetSession() = (%q, %q), want (%q, %q)", userID, tenantSlug, "user-123", "tenant_a")
	}
}

func TestGetSessionNotFound(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()

	_, _, err := s.GetSession(ctx, "nonexistent-session-id")
	if err != ErrNotFound {
		t.Errorf("GetSession() error = %v, want ErrNotFound", err)
	}
}

func TestSaveAndGetOTP(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()
	sessionID := "test-otp-session-" + t.Name()

	if err := s.SaveOTP(ctx, "tenant_a", sessionID, "123456", time.Minute); err != nil {
		t.Fatalf("SaveOTP() error = %v", err)
	}
	t.Cleanup(func() { s.DeleteOTP(ctx, "tenant_a", sessionID) })

	code, err := s.GetOTP(ctx, "tenant_a", sessionID)
	if err != nil {
		t.Fatalf("GetOTP() error = %v", err)
	}
	if code != "123456" {
		t.Errorf("GetOTP() = %q, want %q", code, "123456")
	}
}

func TestDeleteOTPMakesItUnavailable(t *testing.T) {
	s := testStore(t)
	ctx := context.Background()
	sessionID := "test-delete-otp-" + t.Name()

	if err := s.SaveOTP(ctx, "tenant_a", sessionID, "654321", time.Minute); err != nil {
		t.Fatalf("SaveOTP() error = %v", err)
	}
	if err := s.DeleteOTP(ctx, "tenant_a", sessionID); err != nil {
		t.Fatalf("DeleteOTP() error = %v", err)
	}

	_, err := s.GetOTP(ctx, "tenant_a", sessionID)
	if err != ErrNotFound {
		t.Errorf("GetOTP() after delete error = %v, want ErrNotFound", err)
	}
}
