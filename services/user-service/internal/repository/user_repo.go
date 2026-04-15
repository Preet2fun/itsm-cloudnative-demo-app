package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	"github.com/itsm-cloudnative/user-service/internal/models"
)

// ErrNotFound is returned when a queried user does not exist.
var ErrNotFound = errors.New("user not found")

// ErrEmailTaken is returned when creating a user with an already-registered email.
var ErrEmailTaken = errors.New("email already registered")

// Repo provides all database operations for the users table.
// Every method sets search_path to the given tenant schema before querying.
type Repo struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

// FindByEmail returns the user matching the email in the given tenant schema.
func (r *Repo) FindByEmail(ctx context.Context, slug, email string) (*models.User, error) {
	var u models.User
	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		row := conn.QueryRow(ctx,
			`SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at
			   FROM users WHERE email = $1`,
			email,
		)
		return row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
			&u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindByID returns the user matching the UUID in the given tenant schema.
func (r *Repo) FindByID(ctx context.Context, slug string, id uuid.UUID) (*models.User, error) {
	var u models.User
	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		row := conn.QueryRow(ctx,
			`SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at
			   FROM users WHERE id = $1`,
			id,
		)
		return row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
			&u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// List returns a paginated set of users from the given tenant schema.
func (r *Repo) List(ctx context.Context, slug string, limit, offset int) ([]*models.User, int64, error) {
	var users []*models.User
	var total int64

	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		// Count total
		row := conn.QueryRow(ctx, `SELECT COUNT(*) FROM users`)
		if err := row.Scan(&total); err != nil {
			return err
		}

		rows, err := conn.Query(ctx,
			`SELECT id, email, password_hash, full_name, role, is_active, created_at, updated_at
			   FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
			limit, offset,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var u models.User
			if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
				&u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
				return err
			}
			users = append(users, &u)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

// Create inserts a new user into the tenant schema and returns the persisted record.
func (r *Repo) Create(ctx context.Context, slug string, u *models.User) (*models.User, error) {
	var created models.User
	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		row := conn.QueryRow(ctx,
			`INSERT INTO users (email, password_hash, full_name, role)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, email, password_hash, full_name, role, is_active, created_at, updated_at`,
			u.Email, u.PasswordHash, u.FullName, u.Role,
		)
		return row.Scan(&created.ID, &created.Email, &created.PasswordHash,
			&created.FullName, &created.Role, &created.IsActive,
			&created.CreatedAt, &created.UpdatedAt)
	})
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}
	return &created, nil
}

// Update modifies mutable fields on a user. Only non-nil pointer fields are changed.
func (r *Repo) Update(ctx context.Context, slug string, id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error) {
	var u models.User
	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		row := conn.QueryRow(ctx,
			`UPDATE users
			    SET full_name  = COALESCE($2, full_name),
			        role       = COALESCE($3, role),
			        is_active  = COALESCE($4, is_active),
			        updated_at = NOW()
			  WHERE id = $1
			  RETURNING id, email, password_hash, full_name, role, is_active, created_at, updated_at`,
			id, req.FullName, req.Role, req.IsActive,
		)
		return row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
			&u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// Delete removes a user by ID. Returns ErrNotFound if the user does not exist.
func (r *Repo) Delete(ctx context.Context, slug string, id uuid.UUID) error {
	return r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		tag, err := conn.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return ErrNotFound
		}
		return nil
	})
}

// UpdatePassword sets a new password hash for the given user.
func (r *Repo) UpdatePassword(ctx context.Context, slug string, id uuid.UUID, newHash string) error {
	return r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		tag, err := conn.Exec(ctx,
			`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
			id, newHash,
		)
		if err != nil {
			return err
		}
		if tag.RowsAffected() == 0 {
			return ErrNotFound
		}
		return nil
	})
}

// ── helpers ───────────────────────────────────────────────────────────────────

// withConn acquires a connection from the pool, sets search_path to the tenant
// schema, runs fn, then releases the connection back to the pool.
func (r *Repo) withConn(ctx context.Context, slug string, fn func(context.Context, *pgxpool.Conn) error) error {
	conn, err := r.pool.Acquire(ctx)
	if err != nil {
		return fmt.Errorf("acquire connection: %w", err)
	}
	defer conn.Release()

	if err := appdb.SetTenantPath(ctx, conn, slug); err != nil {
		return fmt.Errorf("set tenant path: %w", err)
	}

	return fn(ctx, conn)
}

// isUniqueViolation returns true when err is a PostgreSQL unique constraint error (23505).
func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	return errors.Is(err, &pgUniqueViolation{}) ||
		fmt.Sprintf("%T", err) == "*pgconn.PgError" && containsCode(err, "23505")
}

func containsCode(err error, code string) bool {
	type pgErr interface{ SQLState() string }
	var pe pgErr
	if errors.As(err, &pe) {
		return pe.SQLState() == code
	}
	return false
}

// pgUniqueViolation is a sentinel so we can use errors.Is for type matching.
type pgUniqueViolation struct{}

func (*pgUniqueViolation) Error() string { return "unique violation" }
func (*pgUniqueViolation) Is(target error) bool {
	return containsCode(target, "23505")
}
