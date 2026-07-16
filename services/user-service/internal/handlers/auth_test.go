package handlers

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/itsm-cloudnative/user-service/internal/config"
	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
	"github.com/itsm-cloudnative/user-service/internal/sessionstore"
	"go.opentelemetry.io/otel"
)

// testHandler builds a real AuthHandler against the live DATABASE_URL and
// REDIS_URL. Skips if either is unset — see Global Constraints for why this
// codebase doesn't mock the DB/Redis layer for handler tests.
func testHandler(t *testing.T) *AuthHandler {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	redisURL := os.Getenv("REDIS_URL")
	if dbURL == "" || redisURL == "" {
		t.Skip("DATABASE_URL and REDIS_URL must be set — skipping integration test")
	}

	ctx := context.Background()
	pool, err := appdb.NewPool(ctx, dbURL)
	if err != nil {
		t.Fatalf("db pool: %v", err)
	}
	t.Cleanup(pool.Close)

	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatalf("generate rsa key: %v", err)
	}

	store, err := sessionstore.New(redisURL)
	if err != nil {
		t.Fatalf("session store: %v", err)
	}
	t.Cleanup(func() { store.Close() })

	cfg := &config.Config{
		JWTPrivateKey:  key,
		JWTExpiryHours: 24,
	}
	tracer := otel.Tracer("test")
	meter := otel.Meter("test")

	h, err := NewAuthHandler(repository.New(pool), cfg, tracer, meter, store)
	if err != nil {
		t.Fatalf("NewAuthHandler: %v", err)
	}
	return h
}

func TestLoginReturnsMfaRequired(t *testing.T) {
	h := testHandler(t)

	body, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	w := httptest.NewRecorder()

	h.Login(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Login() status = %d, want %d, body = %s", w.Code, http.StatusOK, w.Body.String())
	}
	var resp models.MfaRequiredResponse
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("decode response: %v", err)
	}
	if !resp.MfaRequired {
		t.Error("MfaRequired = false, want true")
	}
	if resp.SessionID == "" {
		t.Error("SessionID is empty")
	}
}

func TestLoginInvalidCredentials(t *testing.T) {
	h := testHandler(t)

	body, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "wrong-password",
		TenantSlug: "tenant_a",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(body))
	w := httptest.NewRecorder()

	h.Login(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Errorf("Login() status = %d, want %d", w.Code, http.StatusUnauthorized)
	}
}

func TestMfaSendSucceedsAfterLogin(t *testing.T) {
	h := testHandler(t)

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	h.Login(loginW, loginReq)
	var loginResp models.MfaRequiredResponse
	if err := json.NewDecoder(loginW.Body).Decode(&loginResp); err != nil {
		t.Fatalf("decode login response: %v", err)
	}

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: loginResp.SessionID})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	sendW := httptest.NewRecorder()

	h.MfaSend(sendW, sendReq)

	if sendW.Code != http.StatusOK {
		t.Fatalf("MfaSend() status = %d, want %d, body = %s", sendW.Code, http.StatusOK, sendW.Body.String())
	}

	// The OTP must actually have been written to the store.
	code, err := h.store.GetOTP(context.Background(), "tenant_a", loginResp.SessionID)
	if err != nil {
		t.Fatalf("GetOTP() after MfaSend error = %v", err)
	}
	if len(code) != 6 {
		t.Errorf("stored OTP length = %d, want 6", len(code))
	}
}

func TestMfaSendUnknownSession(t *testing.T) {
	h := testHandler(t)

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: "nonexistent-session-id"})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	sendW := httptest.NewRecorder()

	h.MfaSend(sendW, sendReq)

	if sendW.Code != http.StatusUnauthorized {
		t.Errorf("MfaSend() with unknown session status = %d, want %d", sendW.Code, http.StatusUnauthorized)
	}
}

func TestGenerateOTPFormat(t *testing.T) {
	code, err := generateOTP()
	if err != nil {
		t.Fatalf("generateOTP() error = %v", err)
	}
	if len(code) != 6 {
		t.Errorf("generateOTP() len = %d, want 6", len(code))
	}
	for _, c := range code {
		if c < '0' || c > '9' {
			t.Errorf("generateOTP() = %q, contains non-digit character %q", code, c)
			break
		}
	}
}

func TestMfaVerifyFullFlowSucceeds(t *testing.T) {
	h := testHandler(t)
	ctx := context.Background()

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	h.Login(loginW, loginReq)
	var loginResp models.MfaRequiredResponse
	json.NewDecoder(loginW.Body).Decode(&loginResp)

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: loginResp.SessionID})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	h.MfaSend(httptest.NewRecorder(), sendReq)

	code, err := h.store.GetOTP(ctx, "tenant_a", loginResp.SessionID)
	if err != nil {
		t.Fatalf("GetOTP() error = %v", err)
	}

	verifyBody, _ := json.Marshal(models.MfaVerifyRequest{SessionID: loginResp.SessionID, Code: code})
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyW := httptest.NewRecorder()

	h.MfaVerify(verifyW, verifyReq)

	if verifyW.Code != http.StatusOK {
		t.Fatalf("MfaVerify() status = %d, want %d, body = %s", verifyW.Code, http.StatusOK, verifyW.Body.String())
	}
	var verifyResp models.LoginResponse
	if err := json.NewDecoder(verifyW.Body).Decode(&verifyResp); err != nil {
		t.Fatalf("decode verify response: %v", err)
	}
	if verifyResp.Token == "" {
		t.Error("Token is empty")
	}
	if verifyResp.User == nil || verifyResp.User.Email != "alice.admin@globaltech.io" {
		t.Errorf("User = %+v, want email alice.admin@globaltech.io", verifyResp.User)
	}

	// Single-use: verifying again with the same (now-deleted) code must fail.
	verifyAgainReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyAgainW := httptest.NewRecorder()
	h.MfaVerify(verifyAgainW, verifyAgainReq)
	if verifyAgainW.Code != http.StatusUnauthorized {
		t.Errorf("second MfaVerify() with same code status = %d, want %d", verifyAgainW.Code, http.StatusUnauthorized)
	}
}

func TestMfaVerifyWrongCode(t *testing.T) {
	h := testHandler(t)

	loginBody, _ := json.Marshal(models.LoginRequest{
		Email:      "alice.admin@globaltech.io",
		Password:   "Password1!",
		TenantSlug: "tenant_a",
	})
	loginReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(loginBody))
	loginW := httptest.NewRecorder()
	h.Login(loginW, loginReq)
	var loginResp models.MfaRequiredResponse
	json.NewDecoder(loginW.Body).Decode(&loginResp)

	sendBody, _ := json.Marshal(models.MfaSendRequest{SessionID: loginResp.SessionID})
	sendReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/send", bytes.NewReader(sendBody))
	h.MfaSend(httptest.NewRecorder(), sendReq)

	verifyBody, _ := json.Marshal(models.MfaVerifyRequest{SessionID: loginResp.SessionID, Code: "000000"})
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyW := httptest.NewRecorder()

	h.MfaVerify(verifyW, verifyReq)

	if verifyW.Code != http.StatusUnauthorized {
		t.Errorf("MfaVerify() with wrong code status = %d, want %d", verifyW.Code, http.StatusUnauthorized)
	}
}

func TestMfaVerifyUnknownSession(t *testing.T) {
	h := testHandler(t)

	verifyBody, _ := json.Marshal(models.MfaVerifyRequest{SessionID: "nonexistent-session", Code: "123456"})
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/mfa/verify", bytes.NewReader(verifyBody))
	verifyW := httptest.NewRecorder()

	h.MfaVerify(verifyW, verifyReq)

	if verifyW.Code != http.StatusUnauthorized {
		t.Errorf("MfaVerify() with unknown session status = %d, want %d", verifyW.Code, http.StatusUnauthorized)
	}
}
