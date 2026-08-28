package repository

import (
	"context"
	"os"
	"testing"

	appdb "github.com/itsm-cloudnative/user-service/internal/db"
	"github.com/itsm-cloudnative/user-service/internal/models"
)

func testRepo(t *testing.T) *Repo {
	t.Helper()
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		t.Skip("DATABASE_URL not set — skipping repository integration test")
	}
	pool, err := appdb.NewPool(context.Background(), dbURL)
	if err != nil {
		t.Fatalf("db pool: %v", err)
	}
	t.Cleanup(pool.Close)
	return New(pool)
}

func strPtr(s string) *string { return &s }

func TestCreateAndFindByEmail_TenantScoped(t *testing.T) {
	r := testRepo(t)
	ctx := context.Background()

	email := "repo-test-tenant-" + t.Name() + "@example.com"
	u := &models.User{
		Email:        email,
		PasswordHash: "irrelevant-hash",
		FullName:     "Repo Test Tenant User",
		Role:         "agent",
		TenantID:     strPtr("customer_a"),
	}
	created, err := r.Create(ctx, u)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, created.ID) })

	if created.TenantID == nil || *created.TenantID != "customer_a" {
		t.Errorf("created.TenantID = %v, want customer_a", created.TenantID)
	}

	found, err := r.FindByEmail(ctx, email)
	if err != nil {
		t.Fatalf("FindByEmail() error = %v", err)
	}
	if found.ID != created.ID {
		t.Errorf("FindByEmail() ID = %v, want %v", found.ID, created.ID)
	}
}

func TestCreateAndFindByEmail_PlatformStaff(t *testing.T) {
	r := testRepo(t)
	ctx := context.Background()

	email := "repo-test-platform-" + t.Name() + "@example.com"
	u := &models.User{
		Email:        email,
		PasswordHash: "irrelevant-hash",
		FullName:     "Repo Test Platform User",
		Role:         "platform_analyst",
		TenantID:     nil,
	}
	created, err := r.Create(ctx, u)
	if err != nil {
		t.Fatalf("Create() error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, created.ID) })

	if created.TenantID != nil {
		t.Errorf("created.TenantID = %v, want nil", created.TenantID)
	}
}

func TestList_FiltersByTenant(t *testing.T) {
	r := testRepo(t)
	ctx := context.Background()

	tenantUser, err := r.Create(ctx, &models.User{
		Email:        "repo-test-list-tenant-" + t.Name() + "@example.com",
		PasswordHash: "x", FullName: "List Tenant", Role: "viewer",
		TenantID: strPtr("customer_b"),
	})
	if err != nil {
		t.Fatalf("Create() tenant user error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, tenantUser.ID) })

	platformUser, err := r.Create(ctx, &models.User{
		Email:        "repo-test-list-platform-" + t.Name() + "@example.com",
		PasswordHash: "x", FullName: "List Platform", Role: "platform_admin",
		TenantID: nil,
	})
	if err != nil {
		t.Fatalf("Create() platform user error = %v", err)
	}
	t.Cleanup(func() { r.Delete(ctx, platformUser.ID) })

	tenantUsers, _, err := r.List(ctx, "customer_b", 100, 0)
	if err != nil {
		t.Fatalf("List(customer_b) error = %v", err)
	}
	foundTenant := false
	for _, u := range tenantUsers {
		if u.ID == tenantUser.ID {
			foundTenant = true
		}
		if u.ID == platformUser.ID {
			t.Errorf("List(customer_b) unexpectedly returned the platform-staff user")
		}
	}
	if !foundTenant {
		t.Errorf("List(customer_b) did not return the customer_b user")
	}

	platformUsers, _, err := r.List(ctx, "", 100, 0)
	if err != nil {
		t.Fatalf("List(\"\") error = %v", err)
	}
	foundPlatform := false
	for _, u := range platformUsers {
		if u.ID == platformUser.ID {
			foundPlatform = true
		}
		if u.ID == tenantUser.ID {
			t.Errorf("List(\"\") unexpectedly returned the customer_b user")
		}
	}
	if !foundPlatform {
		t.Errorf("List(\"\") did not return the platform-staff user")
	}
}

func TestFindByEmail_NotFound(t *testing.T) {
	r := testRepo(t)
	_, err := r.FindByEmail(context.Background(), "definitely-not-a-real-user@example.com")
	if err != ErrNotFound {
		t.Errorf("FindByEmail() error = %v, want ErrNotFound", err)
	}
}
