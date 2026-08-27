-- Seed data for tenant customer_a — minimal fixtures across all 5 tables,
-- enough to prove multi-tenant isolation and exercise every payment status.
SET search_path TO customer_a, public;

-- ── Restaurants + menu items ────────────────────────────────────────────────
INSERT INTO restaurants (name, cuisine) VALUES ('Tandoor House', 'Indian') RETURNING id AS restaurant_1_id \gset
INSERT INTO restaurants (name, cuisine) VALUES ('Pasta Corner', 'Italian') RETURNING id AS restaurant_2_id \gset

INSERT INTO menu_items (restaurant_id, name, price) VALUES
    (:'restaurant_1_id', 'Butter Chicken', 14.50),
    (:'restaurant_1_id', 'Garlic Naan', 3.50),
    (:'restaurant_2_id', 'Margherita Pizza', 12.00),
    (:'restaurant_2_id', 'Spaghetti Carbonara', 13.50);

-- ── Orders (mixed status) ───────────────────────────────────────────────────
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Asha Rao', '[{"name":"Butter Chicken","qty":1}]', 'delivered', 14.50)
    RETURNING id AS order_1_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_2_id', 'Marco Bianchi', '[{"name":"Margherita Pizza","qty":1}]', 'out_for_delivery', 12.00)
    RETURNING id AS order_2_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Priya Nair', '[{"name":"Garlic Naan","qty":2}]', 'preparing', 7.00)
    RETURNING id AS order_3_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_2_id', 'Luca Conti', '[{"name":"Spaghetti Carbonara","qty":1}]', 'cancelled', 13.50)
    RETURNING id AS order_4_id \gset

-- ── Deliveries (one per non-cancelled order) ────────────────────────────────
INSERT INTO deliveries (order_id, rider_name, status) VALUES
    (:'order_1_id', 'Ravi Kumar', 'delivered'),
    (:'order_2_id', 'Giulia Ferrari', 'in_transit'),
    (:'order_3_id', 'Sana Sheikh', 'assigned');

-- ── Payments (one per order, status matching order lifecycle) ──────────────
INSERT INTO payments (order_id, amount, status, payment_method) VALUES
    (:'order_1_id', 14.50, 'completed', 'mock'),
    (:'order_2_id', 12.00, 'completed', 'mock'),
    (:'order_3_id', 7.00, 'pending', 'mock'),
    (:'order_4_id', 13.50, 'failed', 'mock');
