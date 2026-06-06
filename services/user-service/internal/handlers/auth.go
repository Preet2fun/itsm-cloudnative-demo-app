package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/crypto/bcrypt"

	"github.com/itsm-cloudnative/user-service/internal/config"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
)

const jwtIssuer = "itsm-user-service"

// ITSMClaims is the JWT payload for all tokens issued by the user-service.
// Field names match what Istio outputClaimToHeaders expects (lowercase with underscores).
type ITSMClaims struct {
	TenantID string `json:"tenant_id"`
	Role     string `json:"role"`
	Email    string `json:"email"`
	jwt.RegisteredClaims
}

// AuthHandler handles authentication endpoints.
type AuthHandler struct {
	repo   *repository.Repo
	cfg    *config.Config
	tracer trace.Tracer
}

func NewAuthHandler(repo *repository.Repo, cfg *config.Config, tracer trace.Tracer) *AuthHandler {
	return &AuthHandler{repo: repo, cfg: cfg, tracer: tracer}
}

// Login authenticates a user and returns a signed JWT.
//
// POST /api/v1/auth/login
// Body: { "email": "...", "password": "...", "tenant_slug": "tenant_a" }
func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.login")
	defer span.End()

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.TenantSlug == "" {
		writeError(w, http.StatusBadRequest, "email, password, and tenant_slug are required")
		return
	}

	span.SetAttributes(
		attribute.String("tenant.id", req.TenantSlug),
		attribute.String("user.email", req.Email),
	)

	user, err := h.repo.FindByEmail(ctx, req.TenantSlug, req.Email)
	if errors.Is(err, repository.ErrNotFound) {
		span.SetStatus(codes.Error, "user not found")
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if !user.IsActive {
		span.SetStatus(codes.Error, "user inactive")
		writeError(w, http.StatusUnauthorized, "account is inactive")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		span.SetStatus(codes.Error, "wrong password")
		writeError(w, http.StatusUnauthorized, "invalid credentials")
		return
	}

	token, expiresAt, err := h.issueToken(user, req.TenantSlug)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "token issue failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.role", user.Role))
	span.AddEvent("login_success")

	writeJSON(w, http.StatusOK, &models.LoginResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User:      user.ToResponse(),
	})
}

// Refresh validates the current JWT and issues a new one with a fresh expiry.
//
// POST /api/v1/auth/refresh
// Header: Authorization: Bearer <token>
func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.refresh")
	defer span.End()

	_ = ctx

	raw := extractBearerToken(r)
	if raw == "" {
		writeError(w, http.StatusUnauthorized, "Authorization header missing or malformed")
		return
	}

	claims := &ITSMClaims{}
	_, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodRSA); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return &h.cfg.JWTPrivateKey.PublicKey, nil
	})
	if err != nil {
		span.SetStatus(codes.Error, "invalid token")
		writeError(w, http.StatusUnauthorized, "invalid or expired token")
		return
	}

	user := &models.User{
		ID:    mustParseUUID(claims.Subject),
		Email: claims.Email,
		Role:  claims.Role,
	}
	token, expiresAt, err := h.issueToken(user, claims.TenantID)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "token issue failed")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(
		attribute.String("tenant.id", claims.TenantID),
		attribute.String("user.role", claims.Role),
	)
	span.AddEvent("refresh_success")

	writeJSON(w, http.StatusOK, &models.RefreshResponse{
		Token:     token,
		ExpiresAt: expiresAt,
	})
}

// ── helpers ───────────────────────────────────────────────────────────────────

func (h *AuthHandler) issueToken(user *models.User, tenantSlug string) (string, time.Time, error) {
	expiresAt := time.Now().Add(time.Duration(h.cfg.JWTExpiryHours) * time.Hour)

	claims := ITSMClaims{
		TenantID: tenantSlug,
		Role:     user.Role,
		Email:    user.Email,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    jwtIssuer,
			Subject:   user.ID.String(),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	token.Header["kid"] = "itsm-rs256-v1"

	signed, err := token.SignedString(h.cfg.JWTPrivateKey)
	if err != nil {
		return "", time.Time{}, err
	}
	return signed, expiresAt, nil
}

func extractBearerToken(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if !strings.HasPrefix(auth, "Bearer ") {
		return ""
	}
	return strings.TrimPrefix(auth, "Bearer ")
}

func mustParseUUID(s string) uuid.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil
	}
	return id
}
