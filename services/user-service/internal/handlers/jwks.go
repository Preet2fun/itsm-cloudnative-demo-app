package handlers

import (
	"encoding/base64"
	"net/http"
)

// jwksResponse is the JSON Web Key Set returned to Istio RequestAuthentication.
// For HS256 (symmetric) the key type is "oct" and the secret is base64url-encoded.
//
// NOTE: Istio's envoy JWT filter supports RS256/ES256 natively.
//       The oct key here is served for completeness in Phase 3 testing.
//       In Phase 6 the team can choose to switch to RS256 (generate an RSA key pair,
//       store private key in a K8s Secret, expose only the public key in this endpoint)
//       for full Istio RequestAuthentication compatibility.
type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kty string `json:"kty"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
	K   string `json:"k"` // base64url-encoded key material (oct keys only)
}

// JWKS returns an HTTP handler that serves the service's signing key in JWKS format.
// Path: GET /api/v1/.well-known/jwks.json
func JWKS(jwtSecret string) http.HandlerFunc {
	// Pre-encode the key once at startup
	encoded := base64.RawURLEncoding.EncodeToString([]byte(jwtSecret))

	body := &jwksResponse{
		Keys: []jwk{
			{
				Kty: "oct",
				Use: "sig",
				Kid: "itsm-hs256-v1",
				Alg: "HS256",
				K:   encoded,
			},
		},
	}

	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, body)
	}
}
