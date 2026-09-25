#!/usr/bin/env bash
# Phase 10 — full happy-path smoke test, run on kubernetes-master.
# login (customer_a) -> MFA -> browse restaurants/menu -> place order ->
# create delivery -> process payment. Prints every captured ID at the end
# so traces/metrics/logs can be cross-checked in Jaeger/Grafana afterward.
#
# Usage: SEED_PASSWORD='<the Phase 3 dev password>' bash scripts/phase10-e2e-happy-path.sh
set -euo pipefail

: "${SEED_PASSWORD:?Set SEED_PASSWORD to the dev password picked in Phase 3}"

NODE_IP="$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')"
AUTH_BASE="http://${NODE_IP}:30080"
RESOLVE="--resolve customer-app.dev.local:30080:${NODE_IP}"
BASE="http://customer-app.dev.local:30080"
EMAIL="owner@customer-a.example"

echo "=== 1. Login ==="
SESSION_ID=$(curl -s -X POST "${AUTH_BASE}/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${SEED_PASSWORD}\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["session_id"])')
echo "session_id: ${SESSION_ID}"

curl -s -X POST "${AUTH_BASE}/api/v1/auth/mfa/send" \
  -H 'Content-Type: application/json' -d "{\"session_id\":\"${SESSION_ID}\"}" > /dev/null

CODE=$(kubectl logs -n itsm-dev deploy/user-service --since=60s \
  | grep 'dev-mode: MFA OTP' | grep "\"email\":\"${EMAIL}\"" | tail -1 \
  | python3 -c 'import sys,json; print(json.loads(sys.stdin.readline())["code"])')
echo "mfa code: ${CODE}"

JWT_A=$(curl -s -X POST "${AUTH_BASE}/api/v1/auth/mfa/verify" \
  -H 'Content-Type: application/json' \
  -d "{\"session_id\":\"${SESSION_ID}\",\"code\":\"${CODE}\"}" \
  | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
echo "JWT acquired (${#JWT_A} chars)"
AUTH_HDR=(-H "Authorization: Bearer ${JWT_A}")

echo
echo "=== 2. Browse: list restaurants ==="
RESTAURANTS_JSON=$(curl -s $RESOLVE "${AUTH_HDR[@]}" "${BASE}/api/v1/restaurants")
echo "$RESTAURANTS_JSON" | python3 -m json.tool
REST_ID=$(echo "$RESTAURANTS_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["restaurants"][0]["id"])')
REST_NAME=$(echo "$RESTAURANTS_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["restaurants"][0]["name"])')
echo "Picked restaurant: ${REST_NAME} (${REST_ID})"

echo
echo "=== 3. Browse: list menu items for that restaurant ==="
curl -s $RESOLVE "${AUTH_HDR[@]}" "${BASE}/api/v1/restaurants/${REST_ID}/menu-items" | python3 -m json.tool

echo
echo "=== 4. Place order ==="
ITEMS_B64=$(echo -n '[{"item":"Margherita Pizza","qty":2},{"item":"Garlic Bread","qty":1}]' | base64 -w 0)
ORDER_JSON=$(curl -s $RESOLVE "${AUTH_HDR[@]}" -X POST "${BASE}/api/v1/orders" \
  -H 'Content-Type: application/json' \
  -d "{\"restaurant_id\":\"${REST_ID}\",\"customer_name\":\"Phase 10 E2E Test\",\"items\":\"${ITEMS_B64}\",\"total_amount\":34.50}")
echo "$ORDER_JSON" | python3 -m json.tool
ORDER_ID=$(echo "$ORDER_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "Order created: ${ORDER_ID}"

echo
echo "=== 5. Create delivery for that order ==="
DELIVERY_JSON=$(curl -s $RESOLVE "${AUTH_HDR[@]}" -X POST "${BASE}/api/v1/deliveries" \
  -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"${ORDER_ID}\",\"riderName\":\"Phase 10 Rider\"}")
echo "$DELIVERY_JSON" | python3 -m json.tool
DELIVERY_ID=$(echo "$DELIVERY_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
echo "Delivery created: ${DELIVERY_ID}"

echo
echo "=== 6. Process payment for that order ==="
PAYMENT_JSON=$(curl -s $RESOLVE "${AUTH_HDR[@]}" -X POST "${BASE}/api/v1/payments" \
  -H 'Content-Type: application/json' \
  -d "{\"orderId\":\"${ORDER_ID}\",\"amount\":34.50,\"paymentMethod\":\"mock-card\"}")
echo "$PAYMENT_JSON" | python3 -m json.tool
PAYMENT_ID=$(echo "$PAYMENT_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
PAYMENT_STATUS=$(echo "$PAYMENT_JSON" | python3 -c 'import sys,json;print(json.load(sys.stdin)["status"])')
echo "Payment created: ${PAYMENT_ID} (status: ${PAYMENT_STATUS})"

echo
echo "=== SUMMARY (for trace/log cross-checking) ==="
echo "tenant:      customer_a"
echo "restaurant:  ${REST_ID} (${REST_NAME})"
echo "order:       ${ORDER_ID}"
echo "delivery:    ${DELIVERY_ID}"
echo "payment:     ${PAYMENT_ID} (${PAYMENT_STATUS})"
echo "ran at (UTC): $(date -u +%Y-%m-%dT%H:%M:%SZ)"
