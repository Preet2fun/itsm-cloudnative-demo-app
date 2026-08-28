package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/itsm-cloudnative/user-service/internal/models"
)

// ErrNotFound is returned when a queried user does not exist.
var ErrNotFound = errors.New("user not found")

// ErrEmailTaken is returned when creating a user with an already-registered email.
var ErrEmailTaken = errors.New("email already registered")

// Repo provides all database operations for public.users — the single
// shared identity table for both tenant-scoped Customer App end-users and
// cross-tenant Platform App staff.
type Repo struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

const userColumns = `id, email, password_hash, full_name, role, tenant_id, is_active, created_at, updated_at`

func scanUser(row pgx.Row) (*models.User, error) {
	var u models.User
	err := row.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.FullName,
		&u.Role, &u.TenantID, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// FindByEmail returns the user matching the email, across all tenants.
func (r *Repo) FindByEmail(ctx context.Context, email string) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM public.users WHERE email = $1`, email)
	u, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

// FindByID returns the user matching the UUID.
func (r *Repo) FindByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`SELECT `+userColumns+` FROM public.users WHERE id = $1`, id)
	u, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

// List returns a paginated set of users. tenantID == "" means platform
// staff (tenant_id IS NULL); any other value filters to that tenant.
func (r *Repo) List(ctx context.Context, tenantID string, limit, offset int) ([]*models.User, int64, error) {
	var total int64
	var countRow pgx.Row
	var rows pgx.Rows
	var err error

	if tenantID == "" {
		countRow = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE tenant_id IS NULL`)
	} else {
		countRow = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM public.users WHERE tenant_id = $1`, tenantID)
	}
	if err := countRow.Scan(&total); err != nil {
		return nil, 0, err
	}

	if tenantID == "" {
		rows, err = r.pool.Query(ctx,
			`SELECT `+userColumns+` FROM public.users WHERE tenant_id IS NULL
			 ORDER BY created_at DESC LIMIT $1 OFFSET $2`, limit, offset)
	} else {
		rows, err = r.pool.Query(ctx,
			`SELECT `+userColumns+` FROM public.users WHERE tenant_id = $1
			 ORDER BY created_at DESC LIMIT $2 OFFSET $3`, tenantID, limit, offset)
	}
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		u, err := scanUser(rows)
		if err != nil {
			return nil, 0, err
		}
		users = append(users, u)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

// Create inserts a new user and returns the persisted record.
// u.TenantID drives the inserted row's tenant scope.
func (r *Repo) Create(ctx context.Context, u *models.User) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`INSERT INTO public.users (email, password_hash, full_name, role, tenant_id)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING `+userColumns,
		u.Email, u.PasswordHash, u.FullName, u.Role, u.TenantID,
	)
	created, err := scanUser(row)
	if err != nil {
		if isUniqueViolation(err) {
			return nil, ErrEmailTaken
		}
		return nil, err
	}
	return created, nil
}

// Update modifies mutable fields on a user. Only non-nil pointer fields are changed.
func (r *Repo) Update(ctx context.Context, id uuid.UUID, req *models.UpdateUserRequest) (*models.User, error) {
	row := r.pool.QueryRow(ctx,
		`UPDATE public.users
		    SET full_name  = COALESCE($2, full_name),
		        role       = COALESCE($3, role),
		        is_active  = COALESCE($4, is_active),
		        updated_at = NOW()
		  WHERE id = $1
		  RETURNING `+userColumns,
		id, req.FullName, req.Role, req.IsActive,
	)
	u, err := scanUser(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return u, nil
}

// Delete removes a user by ID. Returns ErrNotFound if the user does not exist.
func (r *Repo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM public.users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// UpdatePassword sets a new password hash for the given user.
func (r *Repo) UpdatePassword(ctx context.Context, id uuid.UUID, newHash string) error {
	tag, err := r.pool.Exec(ctx,
		`UPDATE public.users SET password_hash = $2, updated_at = NOW() WHERE id = $1`,
		id, newHash,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

// isUniqueViolation returns true when err is a PostgreSQL unique constraint error (23505).
func isUniqueViolation(err error) bool {
	return containsCode(err, "23505")
}

func containsCode(err error, code string) bool {
	type pgErr interface{ SQLState() string }
	var pe pgErr
	if errors.As(err, &pe) {
		return pe.SQLState() == code
	}
	return false
}
