package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/go-chi/chi/v5"
	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	appmw "github.com/itsm-cloudnative/user-service/internal/middleware"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
	"go.opentelemetry.io/otel"
)

func testUserHandler(t *testing.T) (*UserHandler, *repository.Repo) {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL must be set — skipping integration test")
	}
	ctx := context.Background()
	pool, err := appdb.NewPool(ctx, dbURL)
	if err != nil {
		t.Fatalf("db pool: %v", err)
	}
	t.Cleanup(pool.Close)

	repo := repository.New(pool)
	tracer := otel.Tracer("test")
	return NewUserHandler(repo, tracer), repo
}

// requestWithTenant builds a plain request carrying X-Tenant-ID (or none,
// for a platform-staff caller). Every test below routes the request through
// the real middleware.TenantRequired (see serveThroughMiddleware) rather
// than faking context values directly — TenantRequired's context key type
// is unexported, so there's no way to fake it from another package anyway,
// and going through the real middleware is more representative besides.
func requestWithTenant(method, path, tenant string, body []byte) *http.Request {
	var req *http.Request
	if body != nil {
		req = httptest.NewRequest(method, path, bytes.NewReader(body))
	} else {
		req = httptest.NewRequest(method, path, nil)
	}
	if tenant != "" {
		req.Header.Set("X-Tenant-ID", tenant)
	}
	return req
}

// withRole sets X-User-Role on a request built by requestWithTenant.
// Final-review finding I2: callerCanAccess's platform-staff branch now
// requires this header to actually claim a platform role — a request with
// no X-Tenant-ID and no X-User-Role is no longer treated as platform staff.
func withRole(req *http.Request, role string) *http.Request {
	req.Header.Set("X-User-Role", role)
	return req
}

// serveThroughMiddleware wraps h with the real TenantRequired middleware so
// context values match production exactly.
func serveThroughMiddleware(h http.HandlerFunc, req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	appmw.TenantRequired(h).ServeHTTP(w, req)
	return w
}

func mustCreateUser(t *testing.T, repo *repository.Repo, tenantID *string, role string) *models.User {
	t.Helper()
	suffix := t.Name()
	u, err := repo.Create(context.Background(), &models.User{
		Email:        "users-test-" + suffix + "-" + role + "@example.com",
		PasswordHash: "irrelevant",
		FullName:     "Users Test",
		Role:         role,
		TenantID:     tenantID,
	})
	if err != nil {
		t.Fatalf("mustCreateUser: %v", err)
	}
	t.Cleanup(func() { repo.Delete(context.Background(), u.ID) })
	return u
}

func strPtr(s string) *string { return &s }

func TestList_TenantScopedCallerSeesOnlyOwnTenant(t *testing.T) {
	h, repo := testUserHandler(t)
	ownTenantUser := mustCreateUser(t, repo, strPtr("customer_a"), "agent")
	otherTenantUser := mustCreateUser(t, repo, strPtr("customer_b"), "agent")

	req := requestWithTenant(http.MethodGet, "/api/v1/users", "customer_a", nil)
	w := serveThroughMiddleware(h.List, req)

	if w.Code != http.StatusOK {
		t.Fatalf("List() status = %d, body = %s", w.Code, w.Body.String())
	}
	var resp models.ListUsersResponse
	json.NewDecoder(w.Body).Decode(&resp)
	foundOwn := false
	for _, u := range resp.Users {
		if u.ID == ownTenantUser.ID {
			foundOwn = true
		}
		if u.ID == otherTenantUser.ID {
			t.Errorf("List(customer_a) unexpectedly returned a customer_b user")
		}
	}
	if !foundOwn {
		t.Errorf("List(customer_a) did not return the customer_a user")
	}
}

func TestList_PlatformCallerSeesOnlyPlatformStaff(t *testing.T) {
	h, repo := testUserHandler(t)
	platformUser := mustCreateUser(t, repo, nil, "platform_analyst")
	mustCreateUser(t, repo, strPtr("customer_c"), "agent")

	req := withRole(requestWithTenant(http.MethodGet, "/api/v1/users", "", nil), "platform_analyst") // no X-Tenant-ID, platform role
	w := serveThroughMiddleware(h.List, req)

	if w.Code != http.StatusOK {
		t.Fatalf("List() status = %d, body = %s", w.Code, w.Body.String())
	}
	var resp models.ListUsersResponse
	json.NewDecoder(w.Body).Decode(&resp)
	found := false
	for _, u := range resp.Users {
		if u.ID == platformUser.ID {
			found = true
		}
	}
	if !found {
		t.Errorf("List() for platform caller did not include the platform-staff user")
	}
}

func TestList_EmptyTenantWithoutPlatformRoleReturns403(t *testing.T) {
	// Final-review finding I2: same guard as GetByID, applied to List.
	h, _ := testUserHandler(t)

	req := requestWithTenant(http.MethodGet, "/api/v1/users", "", nil) // no X-Tenant-ID, no role
	w := serveThroughMiddleware(h.List, req)

	if w.Code != http.StatusForbidden {
		t.Errorf("List() no-tenant-no-role status = %d, want %d, body = %s", w.Code, http.StatusForbidden, w.Body.String())
	}
}

func TestCreate_NewUserInheritsCallersTenant(t *testing.T) {
	h, repo := testUserHandler(t)

	body, _ := json.Marshal(models.CreateUserRequest{
		Email: "created-by-test-" + t.Name() + "@example.com", Password: "Password1!",
		FullName: "Created By Test", Role: "agent",
	})
	req := requestWithTenant(http.MethodPost, "/api/v1/users", "customer_a", body)
	w := serveThroughMiddleware(h.Create, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("Create() status = %d, body = %s", w.Code, w.Body.String())
	}
	var created models.UserResponse
	json.NewDecoder(w.Body).Decode(&created)
	t.Cleanup(func() {
		ctx := context.Background()
		repo.Delete(ctx, created.ID)
	})
	// UserResponse doesn't expose TenantID (never has — see ToResponse),
	// so confirm indirectly: fetching it back as customer_a succeeds.
	getReq := requestWithTenant(http.MethodGet, "/api/v1/users/"+created.ID.String(), "customer_a", nil)
	getReq = withChiURLParam(getReq, "id", created.ID.String())
	getW := serveThroughMiddleware(h.GetByID, getReq)
	if getW.Code != http.StatusOK {
		t.Errorf("newly created user not visible to customer_a caller: status = %d", getW.Code)
	}
}

func TestGetByID_CrossTenantAccessReturns404(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	req := requestWithTenant(http.MethodGet, "/api/v1/users/"+target.ID.String(), "customer_b", nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := serveThroughMiddleware(h.GetByID, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("GetByID() cross-tenant status = %d, want %d", w.Code, http.StatusNotFound)
	}
}

func TestGetByID_PlatformCallerCanAccessAnyTenant(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	req := requestWithTenant(http.MethodGet, "/api/v1/users/"+target.ID.String(), "", nil)
	req = withRole(req, "platform_admin")
	req = withChiURLParam(req, "id", target.ID.String())
	w := serveThroughMiddleware(h.GetByID, req)

	if w.Code != http.StatusOK {
		t.Errorf("GetByID() platform-caller status = %d, want %d, body = %s", w.Code, http.StatusOK, w.Body.String())
	}
}

func TestGetByID_EmptyTenantWithoutPlatformRoleReturns404(t *testing.T) {
	// Final-review finding I2: an absent X-Tenant-ID alone must not grant
	// platform-staff access — X-User-Role must also actually claim a
	// platform role. Before the fix, this request (no tenant, no role)
	// would have succeeded against ANY user in the system.
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	req := requestWithTenant(http.MethodGet, "/api/v1/users/"+target.ID.String(), "", nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := serveThroughMiddleware(h.GetByID, req)

	if w.Code != http.StatusNotFound {
		t.Errorf("GetByID() no-tenant-no-role status = %d, want %d, body = %s", w.Code, http.StatusNotFound, w.Body.String())
	}
}

func TestGetByID_SameTenantAccessSucceeds(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	req := requestWithTenant(http.MethodGet, "/api/v1/users/"+target.ID.String(), "customer_a", nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := serveThroughMiddleware(h.GetByID, req)

	if w.Code != http.StatusOK {
		t.Errorf("GetByID() same-tenant status = %d, want %d", w.Code, http.StatusOK)
	}
}

// withChiURLParam injects a chi URL param the way the real router would —
// needed since these tests call handlers directly, bypassing chi's mux.
func withChiURLParam(r *http.Request, key, value string) *http.Request {
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add(key, value)
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

func TestInternalGetByID_NoLongerTakesTenantSlugParam(t *testing.T) {
	h, repo := testUserHandler(t)
	target := mustCreateUser(t, repo, strPtr("customer_a"), "viewer")

	// No ?tenant_slug=... in the URL at all — the old param is gone.
	req := httptest.NewRequest(http.MethodGet, "/internal/users/"+target.ID.String(), nil)
	req = withChiURLParam(req, "id", target.ID.String())
	w := httptest.NewRecorder()
	h.InternalGetByID(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("InternalGetByID() status = %d, want %d, body = %s", w.Code, http.StatusOK, w.Body.String())
	}
}
