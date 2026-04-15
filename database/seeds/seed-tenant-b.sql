-- Seed: tenant_b  (RetailEdge Corp)
-- Description: 10 users (2 admin, 5 agent, 3 viewer), 20 assets, 15 incidents.
--              Different industry vertical (retail) to demonstrate multi-tenancy isolation.
-- Run AFTER all migrations and after create_tenant_schema('tenant_b') has been called.

SET search_path TO tenant_b, public;

-- ── Register tenant ───────────────────────────────────────────────────────────
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES ('b0000000-0000-0000-0000-000000000001', 'RetailEdge Corp', 'tenant_b', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO tenant_b.users (id, email, password_hash, full_name, role) VALUES
  ('b1000001-0000-0000-0000-000000000001', 'sam.admin@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Sam Admin',       'admin'),
  ('b1000001-0000-0000-0000-000000000002', 'nina.admin@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nina Admin',       'admin'),
  ('b1000001-0000-0000-0000-000000000003', 'oscar.agent@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Oscar Agent',      'agent'),
  ('b1000001-0000-0000-0000-000000000004', 'paula.agent@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Paula Agent',      'agent'),
  ('b1000001-0000-0000-0000-000000000005', 'quinn.agent@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Quinn Agent',      'agent'),
  ('b1000001-0000-0000-0000-000000000006', 'rachel.agent@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Rachel Agent',     'agent'),
  ('b1000001-0000-0000-0000-000000000007', 'steven.agent@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Steven Agent',     'agent'),
  ('b1000001-0000-0000-0000-000000000008', 'tara.viewer@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Tara Viewer',      'viewer'),
  ('b1000001-0000-0000-0000-000000000009', 'uma.viewer@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Uma Viewer',       'viewer'),
  ('b1000001-0000-0000-0000-000000000010', 'victor.viewer@retailedge.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Victor Viewer',    'viewer');

-- ── Assets ────────────────────────────────────────────────────────────────────
INSERT INTO tenant_b.assets (id, name, asset_type, serial_number, status, location, assigned_to, purchased_at, warranty_until, metadata) VALUES
  -- Hardware — POS and retail equipment
  ('b2000001-0000-0000-0000-000000000001', 'POS Terminal Store-01 #1',  'hardware', 'SN-POS-001', 'active',  'Store-01-Checkout-1', NULL, '2023-03-15', '2026-03-15', '{"model":"Ingenico Lane 7000","screen_in":10}'),
  ('b2000001-0000-0000-0000-000000000002', 'POS Terminal Store-01 #2',  'hardware', 'SN-POS-002', 'active',  'Store-01-Checkout-2', NULL, '2023-03-15', '2026-03-15', '{"model":"Ingenico Lane 7000","screen_in":10}'),
  ('b2000001-0000-0000-0000-000000000003', 'POS Terminal Store-02 #1',  'hardware', 'SN-POS-003', 'maintenance','Store-02-Checkout-1',NULL,'2022-11-01','2025-11-01','{"model":"Verifone VX 520","screen_in":7}'),
  ('b2000001-0000-0000-0000-000000000004', 'Barcode Scanner Store-01',  'hardware', 'SN-BC-001',  'active',  'Store-01-Stockroom', NULL, '2023-01-10', '2025-01-10', '{"model":"Zebra DS2208","interface":"USB"}'),
  ('b2000001-0000-0000-0000-000000000005', 'Barcode Scanner Store-02',  'hardware', 'SN-BC-002',  'inactive','Store-02-Stockroom', NULL, '2022-08-20', '2024-08-20', '{"model":"Honeywell 1950g","interface":"USB"}'),
  ('b2000001-0000-0000-0000-000000000006', 'Inventory Management Server','hardware','SN-INV-001', 'active',  'HQ-DataCenter',     NULL, '2022-06-01', '2025-06-01', '{"cpu":"Intel Xeon E-2356G","ram_gb":64,"storage_tb":8}'),
  ('b2000001-0000-0000-0000-000000000007', 'HP Thin Client Mgmt-01',    'hardware', 'SN-HP-TC-001','active', 'HQ-Office-Mgmt',    'b1000001-0000-0000-0000-000000000003','2023-07-01','2026-07-01','{"model":"HP t655","ram_gb":8}'),
  ('b2000001-0000-0000-0000-000000000008', 'Label Printer Store-01',    'hardware', 'SN-LP-001',  'active',  'Store-01-Backoffice',NULL,'2023-02-01','2026-02-01','{"model":"Zebra ZT411","print_dpi":300}'),
  -- Software
  ('b2000001-0000-0000-0000-000000000009', 'Shopify POS Pro',           'software', NULL,          'active',  'Cloud-SaaS',        NULL, '2023-01-01', '2024-12-31', '{"license":"Pro","registers":4,"plan":"annual"}'),
  ('b2000001-0000-0000-0000-000000000010', 'QuickBooks Enterprise 23',  'software', NULL,          'active',  'HQ-Office-Finance', NULL, '2023-06-15', '2024-06-14', '{"license":"Enterprise","seats":3,"version":"23.0"}'),
  ('b2000001-0000-0000-0000-000000000011', 'Windows Server 2022 Std',   'software', NULL,          'active',  'HQ-DataCenter',     NULL, '2022-06-01', '2026-06-01', '{"license":"Standard","cores":16}'),
  ('b2000001-0000-0000-0000-000000000012', 'Norton Endpoint Security',  'software', NULL,          'active',  'All-Endpoints',     NULL, '2024-01-01', '2024-12-31', '{"license":"Endpoint","devices":20}'),
  ('b2000001-0000-0000-0000-000000000013', 'Cisco Meraki MDM',          'software', NULL,          'active',  'Cloud-SaaS',        NULL, '2023-09-01', '2024-08-31', '{"license":"MDM","devices":30}'),
  -- Network
  ('b2000001-0000-0000-0000-000000000014', 'Cisco Meraki MX68 Store-01','network',  'SN-MX68-001','active',  'Store-01-Network',  NULL, '2022-04-01', '2025-04-01', '{"throughput_mbps":450,"wan_ports":2}'),
  ('b2000001-0000-0000-0000-000000000015', 'Cisco Meraki MX68 Store-02','network',  'SN-MX68-002','active',  'Store-02-Network',  NULL, '2022-04-01', '2025-04-01', '{"throughput_mbps":450,"wan_ports":2}'),
  ('b2000001-0000-0000-0000-000000000016', 'Cisco Meraki MS120 Switch', 'network',  'SN-MS120-001','active', 'HQ-DataCenter',     NULL, '2022-06-01', '2025-06-01', '{"ports":24,"poe":false}'),
  ('b2000001-0000-0000-0000-000000000017', 'Meraki MR46 AP Store-01',   'network',  'SN-MR46-001','active',  'Store-01',          NULL, '2023-01-20', '2026-01-20', '{"standard":"WiFi 6","mimo":"4x4"}'),
  ('b2000001-0000-0000-0000-000000000018', 'Meraki MR46 AP Store-02',   'network',  'SN-MR46-002','active',  'Store-02',          NULL, '2023-01-20', '2026-01-20', '{"standard":"WiFi 6","mimo":"4x4"}'),
  ('b2000001-0000-0000-0000-000000000019', 'SD-WAN vEdge HQ',           'network',  'SN-SDWAN-001','active', 'HQ-Edge',           NULL, '2022-10-10', '2025-10-10', '{"provider":"Cisco Viptela","bw_mbps":1000}'),
  ('b2000001-0000-0000-0000-000000000020', 'ISP Link Primary — HQ',     'network',  NULL,          'active',  'HQ-Edge',           NULL, '2022-01-01', NULL,         '{"provider":"Comcast Business","bw_mbps":1000,"type":"fibre"}');

-- ── Incidents ─────────────────────────────────────────────────────────────────
INSERT INTO tenant_b.incidents (id, title, description, priority, status, assigned_to, related_asset, resolved_at, sla_breach_at, created_at, updated_at) VALUES
  ('b3000001-0000-0000-0000-000000000001',
   'Store-01 POS checkout lane down — transactions failing',
   'POS Terminal Store-01 #2 is throwing payment gateway timeout errors. Customers at checkout cannot complete card transactions.',
   'P1', 'in_progress',
   'b1000001-0000-0000-0000-000000000003',
   'b2000001-0000-0000-0000-000000000002',
   NULL,
   NOW() + INTERVAL '20 minutes',
   NOW() - INTERVAL '40 minutes', NOW() - INTERVAL '10 minutes'),

  ('b3000001-0000-0000-0000-000000000002',
   'Inventory server disk at 96% capacity',
   'Inventory management server storage utilisation critical. Write operations may fail causing stock level corruption.',
   'P1', 'open',
   'b1000001-0000-0000-0000-000000000004',
   'b2000001-0000-0000-0000-000000000006',
   NULL,
   NOW() + INTERVAL '45 minutes',
   NOW() - INTERVAL '15 minutes', NOW() - INTERVAL '15 minutes'),

  ('b3000001-0000-0000-0000-000000000003',
   'Shopify POS Pro API rate limit breach',
   'Shopify reporting 429 Too Many Requests from our integration. End-of-day sync for Store-01 and Store-02 is queued.',
   'P2', 'in_progress',
   'b1000001-0000-0000-0000-000000000005',
   'b2000001-0000-0000-0000-000000000009',
   NULL,
   NOW() + INTERVAL '3 hours',
   NOW() - INTERVAL '1 hour', NOW() - INTERVAL '20 minutes'),

  ('b3000001-0000-0000-0000-000000000004',
   'Store-02 POS maintenance extended',
   'POS Terminal Store-02 #1 is in maintenance longer than planned. Vendor on-site today but parts need to be ordered.',
   'P2', 'open',
   'b1000001-0000-0000-0000-000000000006',
   'b2000001-0000-0000-0000-000000000003',
   NULL,
   NOW() + INTERVAL '2 hours',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  ('b3000001-0000-0000-0000-000000000005',
   'Norton Endpoint detection on Store-01 workstation',
   'Norton flagged suspicious executable on Store-01 back-office PC. Quarantined but investigation required.',
   'P2', 'in_progress',
   'b1000001-0000-0000-0000-000000000003',
   'b2000001-0000-0000-0000-000000000012',
   NULL,
   NOW() + INTERVAL '1 hour',
   NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour'),

  ('b3000001-0000-0000-0000-000000000006',
   'Meraki MX68 Store-02 VPN tunnel flapping',
   'SD-WAN VPN tunnel between Store-02 and HQ has been flapping for 4 hours. Affecting real-time stock sync.',
   'P3', 'open',
   'b1000001-0000-0000-0000-000000000007',
   'b2000001-0000-0000-0000-000000000015',
   NULL,
   NOW() + INTERVAL '20 hours',
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

  ('b3000001-0000-0000-0000-000000000007',
   'QuickBooks Enterprise licence expiry in 30 days',
   'QuickBooks licence expires 2024-06-14. Renewal must be processed through Finance with 15-day lead time.',
   'P3', 'open',
   'b1000001-0000-0000-0000-000000000004',
   'b2000001-0000-0000-0000-000000000010',
   NULL,
   NOW() + INTERVAL '22 hours',
   NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),

  ('b3000001-0000-0000-0000-000000000008',
   'Barcode scanner Store-02 inactive — stock counts delayed',
   'Store-02 barcode scanner has been inactive since last shift. Manual stock counts required until resolved.',
   'P3', 'open',
   'b1000001-0000-0000-0000-000000000005',
   'b2000001-0000-0000-0000-000000000005',
   NULL,
   NOW() + INTERVAL '18 hours',
   NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),

  ('b3000001-0000-0000-0000-000000000009',
   'Cisco Meraki MDM licence renewal needed',
   'MDM licence for 30 devices expires 2024-08-31. IT to raise PO with 60 days advance.',
   'P3', 'open',
   'b1000001-0000-0000-0000-000000000006',
   'b2000001-0000-0000-0000-000000000013',
   NULL,
   NOW() + INTERVAL '21 hours',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  ('b3000001-0000-0000-0000-000000000010',
   'Windows Server 2022 patch pending reboot',
   'Monthly Windows Update requires a reboot on inventory server. Schedule for 03:00 UTC Sunday.',
   'P3', 'resolved',
   'b1000001-0000-0000-0000-000000000007',
   'b2000001-0000-0000-0000-000000000011',
   NOW() - INTERVAL '1 day' + INTERVAL '1 hour',
   NOW() - INTERVAL '1 day' + INTERVAL '24 hours',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '1 hour'),

  ('b3000001-0000-0000-0000-000000000011',
   'Label printer Store-01 jamming frequently',
   'Zebra ZT411 printer is jamming every 200 labels. Maintenance kit may be needed.',
   'P4', 'open',
   'b1000001-0000-0000-0000-000000000003',
   'b2000001-0000-0000-0000-000000000008',
   NULL,
   NOW() + INTERVAL '70 hours',
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  ('b3000001-0000-0000-0000-000000000012',
   'HQ WiFi AP MR46 firmware behind one version',
   'Meraki MR46 AP Store-01 is on firmware 29.4 instead of 29.6. Auto-upgrade failed.',
   'P4', 'open',
   'b1000001-0000-0000-0000-000000000004',
   'b2000001-0000-0000-0000-000000000017',
   NULL,
   NOW() + INTERVAL '68 hours',
   NOW() - INTERVAL '10 hours', NOW() - INTERVAL '10 hours'),

  ('b3000001-0000-0000-0000-000000000013',
   'HP Thin Client power supply noise',
   'Oscar Agent reports HP t655 thin client making buzzing noise from PSU. No performance impact yet.',
   'P4', 'open',
   'b1000001-0000-0000-0000-000000000005',
   'b2000001-0000-0000-0000-000000000007',
   NULL,
   NOW() + INTERVAL '65 hours',
   NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

  ('b3000001-0000-0000-0000-000000000014',
   'SD-WAN vEdge HQ config backup overdue',
   'Last successful config backup of Viptela vEdge was 18 days ago. Schedule backup via vManage.',
   'P4', 'open',
   'b1000001-0000-0000-0000-000000000006',
   'b2000001-0000-0000-0000-000000000019',
   NULL,
   NOW() + INTERVAL '72 hours',
   NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),

  ('b3000001-0000-0000-0000-000000000015',
   'ISP primary link intermittent packet loss',
   'Comcast Business ISP link at HQ showing 0.3% packet loss over last 24 hours. Opened ISP ticket COM-229834.',
   'P4', 'open',
   'b1000001-0000-0000-0000-000000000007',
   'b2000001-0000-0000-0000-000000000020',
   NULL,
   NOW() + INTERVAL '60 hours',
   NOW() - INTERVAL '24 hours', NOW() - INTERVAL '24 hours');

-- ── Incident Events ───────────────────────────────────────────────────────────
INSERT INTO tenant_b.incident_events (incident_id, actor_id, event_type, payload) VALUES
  -- INC-001: POS down
  ('b3000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000001',
   'status_change', '{"from":"open","to":"in_progress"}'),
  ('b3000001-0000-0000-0000-000000000001', 'b1000001-0000-0000-0000-000000000003',
   'comment',       '{"body":"Restarted payment gateway integration service. Testing card transactions now."}'),

  -- INC-002: Inventory disk
  ('b3000001-0000-0000-0000-000000000002', 'b1000001-0000-0000-0000-000000000002',
   'assignment',    '{"assigned_to":"b1000001-0000-0000-0000-000000000004","note":"Urgent — escalating to on-call engineer"}'),

  -- INC-003: Shopify rate limit
  ('b3000001-0000-0000-0000-000000000003', 'b1000001-0000-0000-0000-000000000005',
   'comment',       '{"body":"Implemented exponential back-off in sync service. Re-queuing failed batches."}'),
  ('b3000001-0000-0000-0000-000000000003', 'b1000001-0000-0000-0000-000000000005',
   'status_change', '{"from":"open","to":"in_progress"}'),

  -- INC-010: Windows patch resolved
  ('b3000001-0000-0000-0000-000000000010', 'b1000001-0000-0000-0000-000000000007',
   'status_change', '{"from":"open","to":"in_progress","note":"Maintenance window confirmed 03:00 UTC Sunday"}'),
  ('b3000001-0000-0000-0000-000000000010', 'b1000001-0000-0000-0000-000000000007',
   'resolution',    '{"body":"Windows Server patched and rebooted cleanly. All inventory services confirmed healthy post-reboot.","duration_min":55}');
