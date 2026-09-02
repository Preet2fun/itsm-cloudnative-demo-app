package handlers

import "testing"

// callerCanAccess and isPlatformStaff are pure functions — no database or
// Redis needed. Final-review finding I2/I3: these table cases specifically
// cover the fix for "an absent X-Tenant-ID must not, by itself, grant
// cross-tenant access" — before the fix, TestEmptyTenantNoPlatformRoleDenied
// below would have returned true.

func TestCallerCanAccess(t *testing.T) {
	cases := []struct {
		name         string
		callerTenant string
		callerRole   string
		target       *string
		want         bool
	}{
		{"platform_admin, target is platform staff too", "", "platform_admin", nil, true},
		{"platform_admin, target is tenant-scoped", "", "platform_admin", strPtr("customer_a"), true},
		{"platform_analyst, target is tenant-scoped", "", "platform_analyst", strPtr("customer_b"), true},
		{"empty tenant + non-platform role denied", "", "agent", nil, false},
		{"empty tenant + empty role denied", "", "", nil, false},
		{"empty tenant + empty role, tenant-scoped target denied", "", "", strPtr("customer_a"), false},
		{"same tenant, any role, allowed", "customer_a", "agent", strPtr("customer_a"), true},
		{"cross tenant denied", "customer_a", "agent", strPtr("customer_b"), false},
		{"tenant-scoped caller, platform-staff target denied", "customer_a", "agent", nil, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := callerCanAccess(tc.callerTenant, tc.callerRole, tc.target)
			if got != tc.want {
				t.Errorf("callerCanAccess(%q, %q, %v) = %v, want %v",
					tc.callerTenant, tc.callerRole, tc.target, got, tc.want)
			}
		})
	}
}

func TestIsPlatformStaff(t *testing.T) {
	cases := map[string]bool{
		"platform_admin":   true,
		"platform_analyst": true,
		"admin":            false,
		"agent":            false,
		"viewer":           false,
		"":                 false,
	}
	for role, want := range cases {
		if got := isPlatformStaff(role); got != want {
			t.Errorf("isPlatformStaff(%q) = %v, want %v", role, got, want)
		}
	}
}
