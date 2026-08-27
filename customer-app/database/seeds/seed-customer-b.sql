-- Seed data for tenant customer_b — different restaurant set, proves
-- cross-tenant isolation when compared against customer_a's data.
SET search_path TO customer_b, public;

INSERT INTO restaurants (name, cuisine) VALUES ('Sushi Stop', 'Japanese') RETURNING id AS restaurant_1_id \gset

INSERT INTO menu_items (restaurant_id, name, price) VALUES
    (:'restaurant_1_id', 'Salmon Nigiri (6pc)', 11.00),
    (:'restaurant_1_id', 'California Roll', 9.50),
    (:'restaurant_1_id', 'Miso Soup', 4.00);

INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Kenji Watanabe', '[{"name":"Salmon Nigiri (6pc)","qty":1}]', 'delivered', 11.00)
    RETURNING id AS order_1_id \gset
INSERT INTO orders (restaurant_id, customer_name, items, status, total_amount) VALUES
    (:'restaurant_1_id', 'Emma Clarke', '[{"name":"California Roll","qty":1},{"name":"Miso Soup","qty":1}]', 'placed', 13.50)
    RETURNING id AS order_2_id \gset

INSERT INTO deliveries (order_id, rider_name, status) VALUES
    (:'order_1_id', 'Tom Nakamura', 'delivered');

INSERT INTO payments (order_id, amount, status, payment_method) VALUES
    (:'order_1_id', 11.00, 'completed', 'mock'),
    (:'order_2_id', 13.50, 'pending', 'mock');
