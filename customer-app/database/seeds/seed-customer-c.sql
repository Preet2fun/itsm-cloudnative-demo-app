-- Seed data for tenant customer_c — smallest of the three, mirrors
-- platform-app's seed-tenant-c.sql being the minimal-fixture tenant.
SET search_path TO customer_c, public;

INSERT INTO restaurants (name, cuisine) VALUES ('Corner Deli', 'Sandwiches') RETURNING id AS restaurant_1_id \gset

INSERT INTO menu_items (restaurant_id, name, price) VALUES
    (:'restaurant_1_id', 'Turkey Club', 8.50);

INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Sam Okafor', '[{"name":"Turkey Club","qty":1}]', 'delivered', 8.50)
    RETURNING id AS order_1_id \gset

INSERT INTO deliveries (order_id, rider_name, status) VALUES
    (:'order_1_id', 'Dana Osei', 'delivered');

INSERT INTO payments (order_id, amount, status, payment_method) VALUES
    (:'order_1_id', 8.50, 'completed', 'mock');
