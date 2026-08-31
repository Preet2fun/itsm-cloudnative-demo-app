package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel"

	appmw "github.com/itsm-cloudnative/order-service/internal/middleware"
	"github.com/itsm-cloudnative/order-service/internal/models"
	"github.com/itsm-cloudnative/order-service/internal/repository"
)

// fakeRepo is an in-memory OrderRepository double: each field is a
// per-test-case function, so behavior is configured inline without a DB.
type fakeRepo struct {
	listFunc         func(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error)
	findByIDFunc     func(ctx context.Context, slug string, id uuid.UUID) (*models.Order, error)
	createFunc       func(ctx context.Context, slug string, req *models.CreateOrderRequest) (*models.Order, error)
	updateStatusFunc func(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error)
}

func (f *fakeRepo) List(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error) {
	return f.listFunc(ctx, slug, limit, offset)
}

func (f *fakeRepo) FindByID(ctx context.Context, slug string, id uuid.UUID) (*models.Order, error) {
	return f.findByIDFunc(ctx, slug, id)
}

func (f *fakeRepo) Create(ctx context.Context, slug string, req *models.CreateOrderRequest) (*models.Order, error) {
	return f.createFunc(ctx, slug, req)
}

func (f *fakeRepo) UpdateStatus(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error) {
	return f.updateStatusFunc(ctx, slug, id, status)
}

var _ OrderRepository = (*fakeRepo)(nil)

func newTestRouter(h *OrderHandler) http.Handler {
	r := chi.NewRouter()
	r.Route("/api/v1/orders", func(r chi.Router) {
		r.Use(appmw.TenantRequired)
		r.Get("/", h.List)
		r.Post("/", h.Create)
		r.Get("/{id}", h.GetByID)
		r.Put("/{id}/status", h.UpdateStatus)
	})
	return r
}

func mustJSON(t *testing.T, v any) string {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	return string(b)
}

func TestOrderHandler_List(t *testing.T) {
	t.Run("returns orders with default paging", func(t *testing.T) {
		var gotSlug string
		var gotLimit, gotOffset int
		repo := &fakeRepo{
			listFunc: func(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error) {
				gotSlug, gotLimit, gotOffset = slug, limit, offset
				return []*models.Order{{ID: uuid.New(), CustomerName: "Alice", Status: "placed", TotalAmount: 9.99}}, 1, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200; body=%s", rec.Code, rec.Body.String())
		}
		if gotSlug != "customer_a" {
			t.Errorf("slug passed to repo = %q, want customer_a", gotSlug)
		}
		if gotLimit != 20 || gotOffset != 0 {
			t.Errorf("limit/offset = %d/%d, want 20/0", gotLimit, gotOffset)
		}

		var resp models.ListOrdersResponse
		if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if resp.Total != 1 || len(resp.Orders) != 1 {
			t.Errorf("resp = %+v, want 1 order, total 1", resp)
		}
	})

	t.Run("respects custom limit and offset", func(t *testing.T) {
		var gotLimit, gotOffset int
		repo := &fakeRepo{
			listFunc: func(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error) {
				gotLimit, gotOffset = limit, offset
				return nil, 0, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders?limit=5&offset=10", nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200", rec.Code)
		}
		if gotLimit != 5 || gotOffset != 10 {
			t.Errorf("limit/offset = %d/%d, want 5/10", gotLimit, gotOffset)
		}
	})

	t.Run("caps limit at 100", func(t *testing.T) {
		var gotLimit int
		repo := &fakeRepo{
			listFunc: func(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error) {
				gotLimit = limit
				return nil, 0, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders?limit=500", nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if gotLimit != 100 {
			t.Errorf("limit = %d, want capped at 100", gotLimit)
		}
	})

	t.Run("missing tenant header returns 400 before hitting repo", func(t *testing.T) {
		called := false
		repo := &fakeRepo{
			listFunc: func(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error) {
				called = true
				return nil, 0, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", rec.Code)
		}
		if called {
			t.Error("repo.List should not be called when tenant header is missing")
		}
	})

	t.Run("repo error returns 500", func(t *testing.T) {
		repo := &fakeRepo{
			listFunc: func(ctx context.Context, slug string, limit, offset int) ([]*models.Order, int64, error) {
				return nil, 0, errors.New("db down")
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders", nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d, want 500", rec.Code)
		}
	})
}

func TestOrderHandler_Create(t *testing.T) {
	validBody := func() models.CreateOrderRequest {
		return models.CreateOrderRequest{
			RestaurantID: uuid.New(),
			CustomerName: "Alice",
			TotalAmount:  19.99,
			Items:        []byte(`[{"name":"Burger","qty":1}]`),
		}
	}

	t.Run("creates order and returns 201", func(t *testing.T) {
		var gotSlug string
		var gotReq *models.CreateOrderRequest
		repo := &fakeRepo{
			createFunc: func(ctx context.Context, slug string, req *models.CreateOrderRequest) (*models.Order, error) {
				gotSlug, gotReq = slug, req
				return &models.Order{
					ID: uuid.New(), RestaurantID: req.RestaurantID, CustomerName: req.CustomerName,
					Items: req.Items, Status: "placed", TotalAmount: req.TotalAmount,
					CreatedAt: time.Now(), UpdatedAt: time.Now(),
				}, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		body := mustJSON(t, validBody())
		req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewReader([]byte(body)))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusCreated {
			t.Fatalf("status = %d, want 201; body=%s", rec.Code, rec.Body.String())
		}
		if gotSlug != "customer_a" {
			t.Errorf("slug = %q, want customer_a", gotSlug)
		}
		if gotReq.CustomerName != "Alice" {
			t.Errorf("customer_name = %q, want Alice", gotReq.CustomerName)
		}

		var created models.Order
		if err := json.NewDecoder(rec.Body).Decode(&created); err != nil {
			t.Fatalf("decode response: %v", err)
		}
		if created.Status != "placed" {
			t.Errorf("status = %q, want placed", created.Status)
		}
	})

	t.Run("validation errors return 400 without calling repo", func(t *testing.T) {
		cases := []struct {
			name string
			body string
		}{
			{"invalid json", `{not-json`},
			{"missing customer_name", mustJSON(t, models.CreateOrderRequest{RestaurantID: uuid.New(), TotalAmount: 10})},
			{"missing restaurant_id", mustJSON(t, models.CreateOrderRequest{CustomerName: "Bob", TotalAmount: 10})},
			{"zero total_amount", mustJSON(t, models.CreateOrderRequest{CustomerName: "Bob", RestaurantID: uuid.New(), TotalAmount: 0})},
			{"negative total_amount", mustJSON(t, models.CreateOrderRequest{CustomerName: "Bob", RestaurantID: uuid.New(), TotalAmount: -5})},
		}
		for _, tc := range cases {
			t.Run(tc.name, func(t *testing.T) {
				repo := &fakeRepo{
					createFunc: func(ctx context.Context, slug string, req *models.CreateOrderRequest) (*models.Order, error) {
						t.Fatal("repo.Create should not be called for invalid input")
						return nil, nil
					},
				}
				router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

				req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", strings.NewReader(tc.body))
				req.Header.Set("X-Tenant-ID", "customer_a")
				rec := httptest.NewRecorder()
				router.ServeHTTP(rec, req)

				if rec.Code != http.StatusBadRequest {
					t.Fatalf("status = %d, want 400; body=%s", rec.Code, rec.Body.String())
				}
			})
		}
	})

	t.Run("repo error returns 500", func(t *testing.T) {
		repo := &fakeRepo{
			createFunc: func(ctx context.Context, slug string, req *models.CreateOrderRequest) (*models.Order, error) {
				return nil, errors.New("insert failed")
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		body := mustJSON(t, validBody())
		req := httptest.NewRequest(http.MethodPost, "/api/v1/orders", strings.NewReader(body))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d, want 500", rec.Code)
		}
	})
}

func TestOrderHandler_GetByID(t *testing.T) {
	t.Run("returns order", func(t *testing.T) {
		id := uuid.New()
		var gotID uuid.UUID
		var gotSlug string
		repo := &fakeRepo{
			findByIDFunc: func(ctx context.Context, slug string, orderID uuid.UUID) (*models.Order, error) {
				gotSlug, gotID = slug, orderID
				return &models.Order{ID: orderID, CustomerName: "Alice", Status: "placed"}, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders/"+id.String(), nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200; body=%s", rec.Code, rec.Body.String())
		}
		if gotID != id || gotSlug != "customer_a" {
			t.Errorf("repo called with id=%s slug=%s, want id=%s slug=customer_a", gotID, gotSlug, id)
		}
	})

	t.Run("invalid id returns 400", func(t *testing.T) {
		repo := &fakeRepo{
			findByIDFunc: func(ctx context.Context, slug string, id uuid.UUID) (*models.Order, error) {
				t.Fatal("repo.FindByID should not be called for an invalid id")
				return nil, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders/not-a-uuid", nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", rec.Code)
		}
	})

	t.Run("not found returns 404", func(t *testing.T) {
		repo := &fakeRepo{
			findByIDFunc: func(ctx context.Context, slug string, id uuid.UUID) (*models.Order, error) {
				return nil, repository.ErrNotFound
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders/"+uuid.New().String(), nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404", rec.Code)
		}
	})

	t.Run("repo error returns 500", func(t *testing.T) {
		repo := &fakeRepo{
			findByIDFunc: func(ctx context.Context, slug string, id uuid.UUID) (*models.Order, error) {
				return nil, errors.New("db down")
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodGet, "/api/v1/orders/"+uuid.New().String(), nil)
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d, want 500", rec.Code)
		}
	})
}

func TestOrderHandler_UpdateStatus(t *testing.T) {
	t.Run("updates status", func(t *testing.T) {
		id := uuid.New()
		var gotStatus string
		repo := &fakeRepo{
			updateStatusFunc: func(ctx context.Context, slug string, orderID uuid.UUID, status string) (*models.Order, error) {
				gotStatus = status
				return &models.Order{ID: orderID, Status: status}, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		body := mustJSON(t, models.UpdateOrderStatusRequest{Status: "preparing"})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/orders/"+id.String()+"/status", strings.NewReader(body))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusOK {
			t.Fatalf("status = %d, want 200; body=%s", rec.Code, rec.Body.String())
		}
		if gotStatus != "preparing" {
			t.Errorf("status passed to repo = %q, want preparing", gotStatus)
		}
	})

	t.Run("invalid id returns 400", func(t *testing.T) {
		repo := &fakeRepo{
			updateStatusFunc: func(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error) {
				t.Fatal("repo.UpdateStatus should not be called for an invalid id")
				return nil, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		body := mustJSON(t, models.UpdateOrderStatusRequest{Status: "preparing"})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/orders/not-a-uuid/status", strings.NewReader(body))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", rec.Code)
		}
	})

	t.Run("invalid json body returns 400", func(t *testing.T) {
		repo := &fakeRepo{
			updateStatusFunc: func(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error) {
				t.Fatal("repo.UpdateStatus should not be called for a malformed body")
				return nil, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		req := httptest.NewRequest(http.MethodPut, "/api/v1/orders/"+uuid.New().String()+"/status", strings.NewReader(`{bad`))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", rec.Code)
		}
	})

	t.Run("invalid status value returns 400", func(t *testing.T) {
		repo := &fakeRepo{
			updateStatusFunc: func(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error) {
				t.Fatal("repo.UpdateStatus should not be called for an invalid status")
				return nil, nil
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		body := mustJSON(t, models.UpdateOrderStatusRequest{Status: "bogus"})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/orders/"+uuid.New().String()+"/status", strings.NewReader(body))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusBadRequest {
			t.Fatalf("status = %d, want 400", rec.Code)
		}
	})

	t.Run("not found returns 404", func(t *testing.T) {
		repo := &fakeRepo{
			updateStatusFunc: func(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error) {
				return nil, repository.ErrNotFound
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		body := mustJSON(t, models.UpdateOrderStatusRequest{Status: "preparing"})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/orders/"+uuid.New().String()+"/status", strings.NewReader(body))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusNotFound {
			t.Fatalf("status = %d, want 404", rec.Code)
		}
	})

	t.Run("repo error returns 500", func(t *testing.T) {
		repo := &fakeRepo{
			updateStatusFunc: func(ctx context.Context, slug string, id uuid.UUID, status string) (*models.Order, error) {
				return nil, errors.New("db down")
			},
		}
		router := newTestRouter(NewOrderHandler(repo, otel.Tracer("test")))

		body := mustJSON(t, models.UpdateOrderStatusRequest{Status: "preparing"})
		req := httptest.NewRequest(http.MethodPut, "/api/v1/orders/"+uuid.New().String()+"/status", strings.NewReader(body))
		req.Header.Set("X-Tenant-ID", "customer_a")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)

		if rec.Code != http.StatusInternalServerError {
			t.Fatalf("status = %d, want 500", rec.Code)
		}
	})
}
