package models

import (
	"time"

	"github.com/google/uuid"
)

// Order mirrors the orders table created by
// public.create_customer_tenant_schema in the tenant schema.
type Order struct {
	ID           uuid.UUID `json:"id"`
	RestaurantID uuid.UUID `json:"restaurant_id"`
	CustomerName string    `json:"customer_name"`
	Items        []byte    `json:"items"` // raw JSONB passthrough
	Status       string    `json:"status"`
	TotalAmount  float64   `json:"total_amount"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// ValidStatuses mirrors the CHECK constraint on orders.status.
var ValidStatuses = map[string]bool{
	"placed":           true,
	"preparing":        true,
	"out_for_delivery": true,
	"delivered":        true,
	"cancelled":        true,
}

type CreateOrderRequest struct {
	RestaurantID uuid.UUID `json:"restaurant_id"`
	CustomerName string    `json:"customer_name"`
	Items        []byte    `json:"items"`
	TotalAmount  float64   `json:"total_amount"`
}

type UpdateOrderStatusRequest struct {
	Status string `json:"status"`
}

type ListOrdersResponse struct {
	Orders []*Order `json:"orders"`
	Total  int64    `json:"total"`
	Limit  int      `json:"limit"`
	Offset int      `json:"offset"`
}
