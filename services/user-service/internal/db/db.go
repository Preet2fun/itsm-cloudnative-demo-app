package db

import (
	"context"
	"fmt"
	"regexp"

	"github.com/jackc/pgx/v5/pgxpool"
)

// slugRe enforces that tenant slugs are safe to embed in SET search_path.
// Only lowercase letters, digits, and underscores — no SQL injection possible.
var slugRe = regexp.MustCompile(`^[a-z][a-z0-9_]{0,62}$`)

// NewPool creates a pgxpool connection pool using the given DATABASE_URL.
// Pool size is capped at 10 connections as defined in the architecture doc.
func NewPool(ctx context.Context, databaseURL string) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return nil, fmt.Errorf("parse database URL: %w", err)
	}
	cfg.MaxConns = 10

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	return pool, nil
}

// SetTenantPath sets search_path on the given connection to the tenant schema.
// Must be called immediately after acquiring a connection and before any query.
// The slug is validated against slugRe to prevent SQL injection.
func SetTenantPath(ctx context.Context, conn *pgxpool.Conn, slug string) error {
	if !slugRe.MatchString(slug) {
		return fmt.Errorf("invalid tenant slug %q", slug)
	}
	// Double-quoting is safe: slug is validated to contain only [a-z0-9_]
	_, err := conn.Exec(ctx, `SET search_path TO "`+slug+`", public`)
	return err
}
