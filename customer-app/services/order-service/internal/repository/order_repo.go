package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	appdb "github.com/itsm-cloudnative/order-service/internal/db"
	"github.com/itsm-cloudnative/order-service/internal/models"
)

// ErrNotFound is returned when a queried order does not exist.
var ErrNotFound = errors.New("order not found")

// Repo provides all database operations for the orders table.
// Every method sets search_path to the given tenant schema before querying.
type Repo struct {
	pool *pgxpool.Pool
}

func New(pool *pgxpool.Pool) *Repo {
	return &Repo{pool: pool}
}

func (r *Repo) List(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error) {
	var orders []*models.Order
	var total int64

	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		row := conn.QueryRow(ctx, `SELECT COUNT(*) FROM orders`)
		if err := row.Scan(&total); err != nil {
			return err
		}

		rows, err := conn.Query(ctx,
			`SELECT id, restaurant_id, customer_name, items, status, total_amount, created_at, updated_at
			   FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
			limit, offset,
		)
		if err != nil {
			return err
		}
		defer rows.Close()

		for rows.Next() {
			var o models.Order
			if err := rows.Scan(&o.ID, &o.RestaurantID, &o.CustomerName, &o.Items,
				&o.Status, &o.TotalAmount, &o.CreatedAt, &o.UpdatedAt); err != nil {
				return err
			}
			orders = append(orders, &o)
		}
		return rows.Err()
	})
	if err != nil {
		return nil, 0, err
	}
	return orders, total, nil
}

func (r *Repo) FindByID(ctx context.Context, slug string, id uuid.UUID) (*models.Order, error) {
	var o models.Order
	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		row := conn.QueryRow(ctx,
			`SELECT id, restaurant_id, customer_name, items, status, total_amount, created_at, updated_at
			   FROM orders WHERE id = $1`,
			id,
		)
		return row.Scan(&o.ID, &o.RestaurantID, &o.CustomerName, &o.Items,
			&o.Status, &o.TotalAmount, &o.CreatedAt, &o.UpdatedAt)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func (r *Repo) Create(ctx context.Context, slug string, req *models.CreateOrderRequest) (*models.Order, error) {
	var created models.Order
	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		items := req.Items
		if items == nil {
			items = []byte(`[]`)
		}
		row := conn.QueryRow(ctx,
			`INSERT INTO orders (restaurant_id, customer_name, items, total_amount)
			 VALUES ($1, $2, $3, $4)
			 RETURNING id, restaurant_id, customer_name, items, status, total_amount, created_at, updated_at`,
			req.RestaurantID, req.CustomerName, items, req.TotalAmount,
		)
		return row.Scan(&created.ID, &created.RestaurantID, &created.CustomerName,
			&created.Items, &created.Status, &created.TotalAmount, &created.CreatedAt, &created.UpdatedAt)
	})
	if err != nil {
		return nil, err
	}
	return &created, nil
}

func (r *Repo) UpdateStatus(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error) {
	var o models.Order
	err := r.withConn(ctx, slug, func(ctx context.Context, conn *pgxpool.Conn) error {
		row := conn.QueryRow(ctx,
			`UPDATE orders SET status = $2, updated_at = NOW()
			  WHERE id = $1
			  RETURNING id, restaurant_id, customer_name, items, status, total_amount, created_at, updated_at`,
			id, status,
		)
		return row.Scan(&o.ID, &o.RestaurantID, &o.CustomerName, &o.Items,
			&o.Status, &o.TotalAmount, &o.CreatedAt, &o.UpdatedAt)
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &o, nil
}

// ── helpers ───────────────────────────────────────────────────────────────────

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
