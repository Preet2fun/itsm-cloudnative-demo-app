# Customer App — Multi-Tenant Isolation Evidence (Phase 2)

Closes GitHub issue [#35](https://github.com/Preet2fun/itsm-cloudnative-demo-app/issues/35).

## What this proves

Every customer-app service resolves its Postgres `search_path` **per request,
server-side, from the `X-Tenant-ID` header** (never from a client-supplied
field). This test confirms that boundary actually holds on the live
`customer-app-dev` deployment: a caller sending `X-Tenant-ID: customer_a`
cannot read `customer_b`'s data through **any** of the four services, by list
endpoint or by direct resource id.

There is no auth layer in front of the services yet (Phase 3), so the test
sends the tenant header directly — exactly the trust model the services run
under today.

## The test

`customer-app/scripts/tenant-isolation-smoke-test.sh` — read-only (all GETs),
safe to re-run. It:

1. **Phase A (positive control)** — as `customer_b`, lists and fetches-by-id
   its own restaurant / order / delivery / payment. All must succeed, so a
   later `404` means "isolated", not "the row doesn't exist".
2. **Phase B (isolation)** — as `customer_a`:
   - `GET /restaurants` and `GET /orders` return only A's rows, and none of
     B's ids appear in the list.
   - `GET /restaurants/{B_id}`, `/orders/{B_id}`, `/deliveries/{B_id}`,
     `/payments/{B_id}` each return **404**.
   - `GET /deliveries?orderId={B_order}` and `GET /payments?orderId={B_order}`
     each return an **empty list**.
3. **Phase C (spot check)** — as `customer_c`, restaurant count is C's own (1).

Assertion counts are anchored to the seeded data
(`customer_a` 2 restaurants / 4 orders, `customer_b` 1 / 2, `customer_c` 1 / 1).

## How to run

```bash
cd customer-app
bash scripts/tenant-isolation-smoke-test.sh
```

Self-manages `kubectl port-forward` for all 4 services in `customer-app-dev`
(service port `80`) and tears them down on exit. To run against a different
namespace or through an ingress once Phase 3 lands:

```bash
NAMESPACE=customer-app-qa bash scripts/tenant-isolation-smoke-test.sh
# or
ORDER_URL=http://… CATALOG_URL=http://… DELIVERY_URL=http://… PAYMENT_URL=http://… \
  bash scripts/tenant-isolation-smoke-test.sh
```

Exit code `0` = every assertion passed.

## Captured run

<!-- PLACEHOLDER: paste the real output of the script run against
     customer-app-dev here, with the date. -->

```
(pending — run the script and paste output)
```

**Result:** _pending_
