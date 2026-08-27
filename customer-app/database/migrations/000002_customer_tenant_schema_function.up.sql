-- Migration: 000002_customer_tenant_schema_function
-- Description: Stored procedure to create an isolated schema for a new
--              Customer App tenant. Calling
--              create_customer_tenant_schema('customer_a') creates schema
--              "customer_a" with all food-delivery tables: restaurants,
--              menu_items, orders, deliveries, payments.
--              One table per owning service: catalog-service owns
--              restaurants/menu_items, order-service owns orders,
--              delivery-service owns deliveries, payment-service owns
--              payments. Mirrors platform-app's create_tenant_schema
--              pattern exactly.
-- Idempotent: yes (uses CREATE … IF NOT EXISTS throughout)

CREATE OR REPLACE FUNCTION public.create_customer_tenant_schema(slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- ── 1. Create schema ─────────────────────────────────────────────────────
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', slug);

    -- ── 2. restaurants (catalog-service) ────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.restaurants (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            name            TEXT        NOT NULL,
            cuisine         TEXT,
            is_active       BOOL        NOT NULL DEFAULT TRUE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug);

    -- ── 3. menu_items (catalog-service) ─────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.menu_items (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id   UUID        NOT NULL REFERENCES %I.restaurants(id) ON DELETE CASCADE,
            name            TEXT        NOT NULL,
            price           NUMERIC(10,2) NOT NULL,
            is_available    BOOL        NOT NULL DEFAULT TRUE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.menu_items(restaurant_id)',
        slug || '_menu_items_restaurant_idx', slug);

    -- ── 4. orders (order-service) ───────────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.orders (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            restaurant_id   UUID        NOT NULL REFERENCES %I.restaurants(id) ON DELETE RESTRICT,
            customer_name   TEXT        NOT NULL,
            items           JSONB       NOT NULL DEFAULT ''[]''::jsonb,
            status          TEXT        NOT NULL DEFAULT ''placed''
                                CHECK (status IN (''placed'',''preparing'',''out_for_delivery'',''delivered'',''cancelled'')),
            total_amount    NUMERIC(10,2) NOT NULL,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.orders(status)',
        slug || '_orders_status_idx', slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.orders(created_at DESC)',
        slug || '_orders_created_desc', slug);

    -- ── 5. deliveries (delivery-service) ────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.deliveries (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id        UUID        NOT NULL REFERENCES %I.orders(id) ON DELETE CASCADE,
            rider_name      TEXT,
            status          TEXT        NOT NULL DEFAULT ''assigned''
                                CHECK (status IN (''assigned'',''picked_up'',''in_transit'',''delivered'',''failed'')),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.deliveries(order_id)',
        slug || '_deliveries_order_idx', slug);

    -- ── 6. payments (payment-service) ───────────────────────────────────────
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.payments (
            id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id        UUID        NOT NULL REFERENCES %I.orders(id) ON DELETE CASCADE,
            amount          NUMERIC(10,2) NOT NULL,
            status          TEXT        NOT NULL DEFAULT ''pending''
                                CHECK (status IN (''pending'',''completed'',''failed'',''refunded'')),
            payment_method  TEXT        NOT NULL DEFAULT ''mock'',
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )', slug, slug);

    EXECUTE format('
        CREATE INDEX IF NOT EXISTS %I ON %I.payments(order_id)',
        slug || '_payments_order_idx', slug);

END;
$$;
