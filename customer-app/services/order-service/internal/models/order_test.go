package models

import "testing"

func TestValidStatuses(t *testing.T) {
	valid := []string{"placed", "preparing", "out_for_delivery", "delivered", "cancelled"}
	for _, s := range valid {
		if !ValidStatuses[s] {
			t.Errorf("ValidStatuses[%q] = false, want true", s)
		}
	}

	invalid := []string{"", "PLACED", "pending", "refunded", "placed "}
	for _, s := range invalid {
		if ValidStatuses[s] {
			t.Errorf("ValidStatuses[%q] = true, want false", s)
		}
	}
}
