package models

import (
	"time"

	"github.com/google/uuid"
)

// User maps directly to the tenant_<slug>.users table.
type User struct {
	ID           uuid.UUID `db:"id"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	FullName     string    `db:"full_name"`
	Role         string    `db:"role"` // admin | agent | viewer
	IsActive     bool      `db:"is_active"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

// UserResponse is the external representation — never includes PasswordHash.
type UserResponse struct {
	ID        uuid.UUID `json:"id"`
	Email     string    `json:"email"`
	FullName  string    `json:"full_name"`
	Role      string    `json:"role"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:        u.ID,
		Email:     u.Email,
		FullName:  u.FullName,
		Role:      u.Role,
		IsActive:  u.IsActive,
		CreatedAt: u.CreatedAt,
		UpdatedAt: u.UpdatedAt,
	}
}

// ── Request types ─────────────────────────────────────────────────────────────

type LoginRequest struct {
	Email      string `json:"email"`
	Password   string `json:"password"`
	TenantSlug string `json:"tenant_slug"`
}

type LoginResponse struct {
	Token     string        `json:"token"`
	ExpiresAt time.Time     `json:"expires_at"`
	User      *UserResponse `json:"user"`
}

// MfaRequiredResponse is returned by Login on valid credentials — no token
// yet, the caller must complete POST /api/v1/auth/mfa/send + /mfa/verify.
type MfaRequiredResponse struct {
	MfaRequired bool   `json:"mfa_required"`
	SessionID   string `json:"session_id"`
}

type MfaSendRequest struct {
	SessionID string `json:"session_id"`
}

type MfaVerifyRequest struct {
	SessionID string `json:"session_id"`
	Code      string `json:"code"`
}

type RefreshResponse struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
}

type CreateUserRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	FullName string `json:"full_name"`
	Role     string `json:"role"` // admin | agent | viewer
}

type UpdateUserRequest struct {
	FullName *string `json:"full_name,omitempty"`
	Role     *string `json:"role,omitempty"`
	IsActive *bool   `json:"is_active,omitempty"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

type ListUsersResponse struct {
	Users  []*UserResponse `json:"users"`
	Total  int64           `json:"total"`
	Limit  int             `json:"limit"`
	Offset int             `json:"offset"`
}
