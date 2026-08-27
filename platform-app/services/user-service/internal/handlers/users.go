package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
	"golang.org/x/crypto/bcrypt"

	"github.com/itsm-cloudnative/user-service/internal/middleware"
	"github.com/itsm-cloudnative/user-service/internal/models"
	"github.com/itsm-cloudnative/user-service/internal/repository"
)

const bcryptCost = 12

// UserHandler handles all user CRUD endpoints.
// It reads tenant identity from context (populated by middleware.TenantRequired).
type UserHandler struct {
	repo   *repository.Repo
	tracer trace.Tracer
}

func NewUserHandler(repo *repository.Repo, tracer trace.Tracer) *UserHandler {
	return &UserHandler{repo: repo, tracer: tracer}
}

// List godoc: GET /api/v1/users?limit=20&offset=0
func (h *UserHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.list")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	limit := queryInt(r, "limit", 20)
	offset := queryInt(r, "offset", 0)
	if limit > 100 {
		limit = 100
	}

	users, total, err := h.repo.List(ctx, slug, limit, offset)
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	resp := &models.ListUsersResponse{
		Users:  make([]*models.UserResponse, 0, len(users)),
		Total:  total,
		Limit:  limit,
		Offset: offset,
	}
	for _, u := range users {
		resp.Users = append(resp.Users, u.ToResponse())
	}

	span.SetAttributes(attribute.Int("result.count", len(users)))
	writeJSON(w, http.StatusOK, resp)
}

// Create godoc: POST /api/v1/users
func (h *UserHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.create")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	var req models.CreateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := validateCreateUser(&req); err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcryptCost)
	if err != nil {
		span.RecordError(err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: string(hash),
		FullName:     req.FullName,
		Role:         req.Role,
	}

	created, err := h.repo.Create(ctx, slug, user)
	if errors.Is(err, repository.ErrEmailTaken) {
		writeError(w, http.StatusConflict, "email already registered")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.id", created.ID.String()))
	span.AddEvent("user_created")
	writeJSON(w, http.StatusCreated, created.ToResponse())
}

// GetByID godoc: GET /api/v1/users/{id}
func (h *UserHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.get")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}
	span.SetAttributes(attribute.String("user.id", id.String()))

	user, err := h.repo.FindByID(ctx, slug, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
}

// Update godoc: PUT /api/v1/users/{id}
func (h *UserHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.update")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req models.UpdateUserRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Role != nil {
		if !validRole(*req.Role) {
			writeError(w, http.StatusBadRequest, "role must be admin, agent, or viewer")
			return
		}
	}

	updated, err := h.repo.Update(ctx, slug, id, &req)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.id", id.String()))
	span.AddEvent("user_updated")
	writeJSON(w, http.StatusOK, updated.ToResponse())
}

// Delete godoc: DELETE /api/v1/users/{id}
func (h *UserHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.delete")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	role := middleware.GetUserRole(ctx)
	span.SetAttributes(
		attribute.String("tenant.id", slug),
		attribute.String("user.role", role),
	)

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	if err := h.repo.Delete(ctx, slug, id); errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	} else if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.SetAttributes(attribute.String("user.id", id.String()))
	span.AddEvent("user_deleted")
	w.WriteHeader(http.StatusNoContent)
}

// ChangePassword godoc: PUT /api/v1/users/{id}/password
func (h *UserHandler) ChangePassword(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.change_password")
	defer span.End()

	slug := middleware.GetTenantID(ctx)
	span.SetAttributes(attribute.String("tenant.id", slug))

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.CurrentPassword == "" || req.NewPassword == "" {
		writeError(w, http.StatusBadRequest, "current_password and new_password are required")
		return
	}
	if len(req.NewPassword) < 8 {
		writeError(w, http.StatusBadRequest, "new_password must be at least 8 characters")
		return
	}

	user, err := h.repo.FindByID(ctx, slug, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)); err != nil {
		span.SetStatus(codes.Error, "wrong current password")
		writeError(w, http.StatusUnauthorized, "current password is incorrect")
		return
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcryptCost)
	if err != nil {
		span.RecordError(err)
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	if err := h.repo.UpdatePassword(ctx, slug, id, string(newHash)); err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	span.AddEvent("password_changed")
	w.WriteHeader(http.StatusNoContent)
}

// InternalGetByID is the service-to-service endpoint used by Notification Service.
// GET /internal/users/{id}?tenant_slug=tenant_a
// No X-Tenant-ID middleware — protected by Istio mTLS in Phase 6.
func (h *UserHandler) InternalGetByID(w http.ResponseWriter, r *http.Request) {
	ctx, span := h.tracer.Start(r.Context(), "itsm.user.internal_get")
	defer span.End()

	slug := r.URL.Query().Get("tenant_slug")
	if slug == "" {
		writeError(w, http.StatusBadRequest, "tenant_slug query parameter is required")
		return
	}
	span.SetAttributes(attribute.String("tenant.id", slug))

	id, err := parseUUIDParam(r, "id")
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid user id")
		return
	}

	user, err := h.repo.FindByID(ctx, slug, id)
	if errors.Is(err, repository.ErrNotFound) {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	if err != nil {
		span.RecordError(err)
		span.SetStatus(codes.Error, "db error")
		writeError(w, http.StatusInternalServerError, "internal error")
		return
	}

	writeJSON(w, http.StatusOK, user.ToResponse())
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

func validRole(role string) bool {
	return role == "admin" || role == "agent" || role == "viewer"
}

func validateCreateUser(req *models.CreateUserRequest) error {
	if req.Email == "" {
		return errors.New("email is required")
	}
	if req.Password == "" || len(req.Password) < 8 {
		return errors.New("password must be at least 8 characters")
	}
	if req.FullName == "" {
		return errors.New("full_name is required")
	}
	if !validRole(req.Role) {
		return errors.New("role must be admin, agent, or viewer")
	}
	return nil
}
