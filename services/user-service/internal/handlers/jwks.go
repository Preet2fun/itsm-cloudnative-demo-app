package handlers

import (
	"crypto/rsa"
	"encoding/base64"
	"math/big"
	"net/http"
)

// jwksResponse is the JSON Web Key Set returned to Istio RequestAuthentication.
// Serves the RSA-2048 public key in JWK format so Istio can validate RS256 tokens.
type jwksResponse struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kty string `json:"kty"` // Key type: RSA
	Use string `json:"use"` // Usage: sig
	Kid string `json:"kid"` // Key ID — must match token header
	Alg string `json:"alg"` // Algorithm: RS256
	N   string `json:"n"`   // Base64url-encoded modulus
	E   string `json:"e"`   // Base64url-encoded public exponent
}

// JWKS returns an HTTP handler that serves the RSA public key in JWKS format.
// Path: GET /api/v1/.well-known/jwks.json
func JWKS(privKey *rsa.PrivateKey) http.HandlerFunc {
	pub := &privKey.PublicKey

	body := &jwksResponse{
		Keys: []jwk{
			{
				Kty: "RSA",
				Use: "sig",
				Kid: "itsm-rs256-v1",
				Alg: "RS256",
				N:   base64.RawURLEncoding.EncodeToString(pub.N.Bytes()),
				E:   base64.RawURLEncoding.EncodeToString(big.NewInt(int64(pub.E)).Bytes()),
			},
		},
	}

	return func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, body)
	}
}
