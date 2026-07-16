// Package sessionstore stores short-lived, pre-JWT authentication state
// (the pending-login session, and the email OTP for that session) in Redis.
package sessionstore

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

// ErrNotFound is returned when a session or OTP key doesn't exist or has expired.
var ErrNotFound = errors.New("sessionstore: not found")

type Store struct {
	client *redis.Client
}

// New creates a Store from a "redis://host:port" (or "rediss://...") URL.
func New(redisURL string) (*Store, error) {
	addr := strings.TrimPrefix(redisURL, "redis://")
	addr = strings.TrimPrefix(addr, "rediss://")
	client := redis.NewClient(&redis.Options{Addr: addr})
	return &Store{client: client}, nil
}

func (s *Store) Close() error {
	return s.client.Close()
}

type pendingSession struct {
	UserID     string `json:"user_id"`
	TenantSlug string `json:"tenant_slug"`
}

func sessionKey(sessionID string) string {
	return "itsm:auth-session:" + sessionID
}

func otpKey(tenantSlug, sessionID string) string {
	return "itsm:" + tenantSlug + ":otp:" + sessionID
}

// SaveSession persists the pending-login user/tenant association, keyed by
// sessionID. Not tenant-scoped in its key — tenant isn't resolvable from any
// other request param at the mfa/send and mfa/verify call sites, so this
// record is the thing that resolves it.
func (s *Store) SaveSession(ctx context.Context, sessionID, userID, tenantSlug string, ttl time.Duration) error {
	rec := pendingSession{UserID: userID, TenantSlug: tenantSlug}
	data, err := json.Marshal(rec)
	if err != nil {
		return err
	}
	return s.client.Set(ctx, sessionKey(sessionID), data, ttl).Err()
}

// GetSession returns the userID and tenantSlug associated with sessionID.
// Returns ErrNotFound if the session doesn't exist or has expired.
func (s *Store) GetSession(ctx context.Context, sessionID string) (userID, tenantSlug string, err error) {
	data, err := s.client.Get(ctx, sessionKey(sessionID)).Result()
	if errors.Is(err, redis.Nil) {
		return "", "", ErrNotFound
	}
	if err != nil {
		return "", "", err
	}
	var rec pendingSession
	if err := json.Unmarshal([]byte(data), &rec); err != nil {
		return "", "", err
	}
	return rec.UserID, rec.TenantSlug, nil
}

// DeleteSession removes the pending-login record.
func (s *Store) DeleteSession(ctx context.Context, sessionID string) error {
	return s.client.Del(ctx, sessionKey(sessionID)).Err()
}

// SaveOTP stores a one-time code for sessionID, scoped to tenantSlug.
func (s *Store) SaveOTP(ctx context.Context, tenantSlug, sessionID, code string, ttl time.Duration) error {
	return s.client.Set(ctx, otpKey(tenantSlug, sessionID), code, ttl).Err()
}

// GetOTP returns the stored code. Returns ErrNotFound if missing/expired.
func (s *Store) GetOTP(ctx context.Context, tenantSlug, sessionID string) (string, error) {
	code, err := s.client.Get(ctx, otpKey(tenantSlug, sessionID)).Result()
	if errors.Is(err, redis.Nil) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", err
	}
	return code, nil
}

// DeleteOTP removes the code — call this immediately after a successful
// match, since a code is single-use.
func (s *Store) DeleteOTP(ctx context.Context, tenantSlug, sessionID string) error {
	return s.client.Del(ctx, otpKey(tenantSlug, sessionID)).Err()
}
