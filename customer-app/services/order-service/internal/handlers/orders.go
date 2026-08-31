package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"

	"github.com/itsm-cloudnative/order-service/internal/middleware"
	"github.com/itsm-cloudnative/order-service/internal/models"
	"github.com/itsm-cloudnative/order-service/internal/repository"
)

// OrderRepository defines the persistence operations OrderHandler depends on.
// It is satisfied by *repository.Repo; tests supply an in-memory fake instead.
type OrderRepository interface {
	List(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error)
	FindByID(ctx context.Context, slug string, id uuid.UUID) (*models.Order, error)
	Create(ctx context.Context, slug string, req *models.CreateOrderRequest) (*models.Order, error)
	UpdateStatus(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error)
}

// OrderHandler handles all order endpoints.
// It reads tenant identity from context (populated by middleware.TenantRequired).
type OrderHandler struct {
	repo   OrderRepository
	tracer trace.Tracer
}

func NewOrderHandler(repo OrderRepository, tracer trace.Tracer) *OrderHandler {
	return &OrderHandler{repo: repo, tracer: tracer}
}

// List godoc: GET /api/v1/orders?limit=20&offset=0
func (h *OrderHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "customer.order.list")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	limit := queryInt(r, "limit", 20)
	offset := queryInt(r, "offset", 0)
	if limit > 100 {
		limit = 100
	}

	orders, total, err := h.repo.List(ctx, slug, limit, offset)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	resp := &models.ListOrdersResponse{
		Orders: orders,
		Total:  total,
		Limit:  limit,
		Offset: offset,
	}
	span.SetAttributes(attribute.Int("result.count", len(orders)))
	writeJSON(w, http.StatusOK, resp)
}

// Create godoc: POST /api/v1/orders
func (h *OrderHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "customer.order.create")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	var req models.CreateOrderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.CustomerName == "" {
		writeError(w, http.StatusBadRequest, "customer_name is required")
		return
	}
	if req.RestaurantID == uuid.Nil {
		writeError(w, http.StatusBadRequest, "restaurant_id is required")
		return
	}
	if req.TotalAmount <= 0 {
		writeError(w, http.StatusBadRequest, "total_amount must be positive")
		return
	}

	created, err := h.repo.Create(ctx, slug, &req)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("order.id", created.ID.String()))
	span.AddEvent("order_created")
	writeJSON(w, http.StatusCreated, created)
}

// GetByID godoc: GET /api/v1/orders/{id}
func (h *OrderHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "customer.order.get")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}
	span.SetAttributes(attribute.String("order.id", id.String()))

	order, err := h.repo.FindByID(ctx, slug, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "order not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, order)
}

// UpdateStatus godoc: PUT /api/v1/orders/{id}/status
func (h *OrderHandler) UpdateStatus(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "customer.order.update_status")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid order id")
		return
	}

	var req models.UpdateOrderStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if !models.ValidStatuses[req.Status] {
		writeError(w, http.StatusBadRequest, "invalid status")
		return
	}

	updated, err := h.repo.UpdateStatus(ctx, slug, id, req.Status)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "order not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("order.id", id.String()), attribute.String("order.status", req.Status))
	span.AddEvent("order_status_updated")
	writeJSON(w, http.StatusOK, updated)
}

// ── shared helpers ────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v) //nolint:errcheck
}

func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}

func parseUUIDParam(r *http.Request, param string) (uuid.UUID, error) {
	return uuid.Parse(chi.URLParam(r, param))
}

func queryInt(r *http.Request, key string, defaultVal int) int {
	s := r.URL.Query().Get(key)
	if s == "" {
		return defaultVal
	}
	n, err := strconv.Atoi(s)
	if err != nil || n < 0 {
		return defaultVal
	}
	return n
}
