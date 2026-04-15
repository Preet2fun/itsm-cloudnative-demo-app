-- Seed: tenant_a  (GlobalTech Solutions)
-- Description: 10 users (2 admin, 5 agent, 3 viewer), 20 assets, 15 incidents
--              with incident_events.  Passwords are bcrypt hashes of "Password1!"
-- Run AFTER all migrations and after create_tenant_schema('tenant_a') has been called.

SET search_path TO tenant_a, public;

-- ── Register tenant in public registry ───────────────────────────────────────
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES ('a0000000-0000-0000-0000-000000000001', 'GlobalTech Solutions', 'tenant_a', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── Users ─────────────────────────────────────────────────────────────────────
-- password_hash = bcrypt("Password1!", cost=10)
INSERT INTO tenant_a.users (id, email, password_hash, full_name, role) VALUES
  ('a1000001-0000-0000-0000-000000000001', 'alice.admin@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alice Admin',   'admin'),
  ('a1000001-0000-0000-0000-000000000002', 'bob.admin@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bob Administrator', 'admin'),
  ('a1000001-0000-0000-0000-000000000003', 'carol.agent@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Carol Agent',   'agent'),
  ('a1000001-0000-0000-0000-000000000004', 'david.agent@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'David Agent',   'agent'),
  ('a1000001-0000-0000-0000-000000000005', 'eve.agent@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Eve Agent',     'agent'),
  ('a1000001-0000-0000-0000-000000000006', 'frank.agent@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Frank Agent',   'agent'),
  ('a1000001-0000-0000-0000-000000000007', 'grace.agent@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Grace Agent',   'agent'),
  ('a1000001-0000-0000-0000-000000000008', 'henry.viewer@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Henry Viewer',  'viewer'),
  ('a1000001-0000-0000-0000-000000000009', 'iris.viewer@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Iris Viewer',   'viewer'),
  ('a1000001-0000-0000-0000-000000000010', 'james.viewer@globaltech.io',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'James Viewer',  'viewer');

-- ── Assets ────────────────────────────────────────────────────────────────────
INSERT INTO tenant_a.assets (id, name, asset_type, serial_number, status, location, assigned_to, purchased_at, warranty_until, metadata) VALUES
  -- Hardware
  ('a2000001-0000-0000-0000-000000000001', 'Dell PowerEdge R750 #1',  'hardware', 'SN-DELL-001', 'active',      'DC-Rack-A1',  NULL, '2023-01-10', '2026-01-10', '{"cpu":"Intel Xeon Gold 6338","ram_gb":256,"storage_tb":4}'),
  ('a2000001-0000-0000-0000-000000000002', 'Dell PowerEdge R750 #2',  'hardware', 'SN-DELL-002', 'active',      'DC-Rack-A2',  NULL, '2023-01-10', '2026-01-10', '{"cpu":"Intel Xeon Gold 6338","ram_gb":256,"storage_tb":4}'),
  ('a2000001-0000-0000-0000-000000000003', 'HP ProLiant DL380 Gen10', 'hardware', 'SN-HP-001',   'maintenance', 'DC-Rack-B1',  NULL, '2022-06-15', '2025-06-15', '{"cpu":"AMD EPYC 7313","ram_gb":128,"storage_tb":2}'),
  ('a2000001-0000-0000-0000-000000000004', 'Cisco UCS C240 M6',       'hardware', 'SN-CISCO-001','active',      'DC-Rack-B2',  NULL, '2023-03-20', '2026-03-20', '{"cpu":"Intel Xeon Silver 4314","ram_gb":192,"storage_tb":6}'),
  ('a2000001-0000-0000-0000-000000000005', 'MacBook Pro 16 M3 - Carol','hardware','SN-MBP-003',  'active',      'Office-Floor2','a1000001-0000-0000-0000-000000000003','2024-01-05','2027-01-05','{"model":"MacBook Pro 16","chip":"M3 Pro","ram_gb":36}'),
  ('a2000001-0000-0000-0000-000000000006', 'MacBook Pro 16 M3 - David','hardware','SN-MBP-004',  'active',      'Office-Floor2','a1000001-0000-0000-0000-000000000004','2024-01-05','2027-01-05','{"model":"MacBook Pro 16","chip":"M3 Pro","ram_gb":36}'),
  ('a2000001-0000-0000-0000-000000000007', 'Dell Latitude 5540 - Eve', 'hardware','SN-LAT-001',  'active',      'Remote',       'a1000001-0000-0000-0000-000000000005','2023-09-01','2026-09-01','{"model":"Latitude 5540","cpu":"i7-1365U","ram_gb":32}'),
  ('a2000001-0000-0000-0000-000000000008', 'Network UPS APC 3000VA',   'hardware','SN-UPS-001',  'active',      'DC-Rack-A-PDU',NULL,'2021-11-20','2024-11-20','{"capacity_va":3000,"runtime_min":15}'),
  -- Software
  ('a2000001-0000-0000-0000-000000000009', 'Ubuntu Server 22.04 LTS', 'software', NULL,           'active',      'DC-Rack-A1',  NULL, '2023-01-10', NULL,         '{"license":"open-source","version":"22.04.3","seats":null}'),
  ('a2000001-0000-0000-0000-000000000010', 'Red Hat Enterprise Linux 9','software',NULL,          'active',      'DC-Rack-B2',  NULL, '2023-03-20', '2026-03-20', '{"license":"subscription","version":"9.3","seats":2}'),
  ('a2000001-0000-0000-0000-000000000011', 'GitLab EE 16.x',           'software', NULL,          'active',      'Cloud-SaaS',  NULL, '2023-07-01', '2024-06-30', '{"license":"EE","tier":"Premium","seats":50}'),
  ('a2000001-0000-0000-0000-000000000012', 'Datadog APM',              'software', NULL,           'active',      'Cloud-SaaS',  NULL, '2024-01-01', '2024-12-31', '{"license":"PRO","hosts":10}'),
  ('a2000001-0000-0000-0000-000000000013', 'Microsoft 365 Business',   'software', NULL,           'active',      'Cloud-SaaS',  NULL, '2023-06-01', '2024-05-31', '{"license":"Business Standard","seats":25}'),
  -- Network
  ('a2000001-0000-0000-0000-000000000014', 'Cisco Catalyst 9300-48P',  'network',  'SN-SW-001',   'active',      'DC-MDF',      NULL, '2022-08-10', '2025-08-10', '{"ports":48,"poe":true,"speed_gbps":1}'),
  ('a2000001-0000-0000-0000-000000000015', 'Cisco Catalyst 9300-48P #2','network', 'SN-SW-002',   'active',      'DC-IDF-1',    NULL, '2022-08-10', '2025-08-10', '{"ports":48,"poe":true,"speed_gbps":1}'),
  ('a2000001-0000-0000-0000-000000000016', 'FortiGate 200F Firewall',   'network', 'SN-FW-001',   'active',      'DC-Edge',     NULL, '2023-02-14', '2026-02-14', '{"throughput_gbps":20,"vdom":10}'),
  ('a2000001-0000-0000-0000-000000000017', 'Cisco ASR 1001-X Router',   'network', 'SN-RTR-001',  'active',      'DC-Edge',     NULL, '2022-05-01', '2025-05-01', '{"bandwidth_gbps":2.5,"wan_ports":2}'),
  ('a2000001-0000-0000-0000-000000000018', 'Palo Alto PA-3220',         'network', 'SN-PA-001',   'maintenance', 'DC-DMZ',      NULL, '2021-10-01', '2024-10-01', '{"throughput_gbps":4,"sessions":500000}'),
  ('a2000001-0000-0000-0000-000000000019', 'Aruba AP-635 WiFi 6E #1',  'network',  'SN-AP-001',   'active',      'Office-Floor1',NULL,'2023-11-01','2026-11-01','{"standard":"WiFi 6E","bands":3}'),
  ('a2000001-0000-0000-0000-000000000020', 'Aruba AP-635 WiFi 6E #2',  'network',  'SN-AP-002',   'inactive',    'Office-Floor3',NULL,'2023-11-01','2026-11-01','{"standard":"WiFi 6E","bands":3}');

-- ── Incidents ─────────────────────────────────────────────────────────────────
INSERT INTO tenant_a.incidents (id, title, description, priority, status, assigned_to, related_asset, resolved_at, sla_breach_at, created_at, updated_at) VALUES
  -- P1 — critical, SLA 1 hour
  ('a3000001-0000-0000-0000-000000000001',
   'Production database unreachable',
   'PostgreSQL primary node on DC-Rack-A1 stopped responding. All application services throwing connection refused. Immediate escalation required.',
   'P1', 'resolved',
   'a1000001-0000-0000-0000-000000000003',
   'a2000001-0000-0000-0000-000000000001',
   NOW() - INTERVAL '2 days' + INTERVAL '45 minutes',
   NOW() - INTERVAL '2 days' + INTERVAL '1 hour',
   NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '45 minutes'),

  ('a3000001-0000-0000-0000-000000000002',
   'Core network switch failure — DC-MDF',
   'Cisco Catalyst 9300 in main distribution frame is not forwarding packets. 80% of datacenter workloads impacted.',
   'P1', 'in_progress',
   'a1000001-0000-0000-0000-000000000004',
   'a2000001-0000-0000-0000-000000000014',
   NULL,
   NOW() + INTERVAL '30 minutes',
   NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '5 minutes'),

  -- P2 — high, SLA 4 hours
  ('a3000001-0000-0000-0000-000000000003',
   'FortiGate firewall memory leak detected',
   'Monitoring alert shows FortiGate 200F memory utilisation at 94%. Performance degradation expected within hours.',
   'P2', 'in_progress',
   'a1000001-0000-0000-0000-000000000003',
   'a2000001-0000-0000-0000-000000000016',
   NULL,
   NOW() + INTERVAL '2 hours',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),

  ('a3000001-0000-0000-0000-000000000004',
   'Datadog APM missing traces for user-service',
   'Traces from user-service have not appeared in Datadog for 3 hours. Possibly OTel exporter misconfiguration after last deployment.',
   'P2', 'open',
   'a1000001-0000-0000-0000-000000000005',
   'a2000001-0000-0000-0000-000000000012',
   NULL,
   NOW() + INTERVAL '1 hour',
   NOW() - INTERVAL '3 hours', NOW() - INTERVAL '3 hours'),

  ('a3000001-0000-0000-0000-000000000005',
   'HP ProLiant server under-voltage warning',
   'IPMI alert: HP ProLiant DL380 receiving under-voltage on PSU-2. Risk of unexpected shutdown if not addressed.',
   'P2', 'open',
   'a1000001-0000-0000-0000-000000000006',
   'a2000001-0000-0000-0000-000000000003',
   NULL,
   NOW() + INTERVAL '3 hours',
   NOW() - INTERVAL '1 hour', NOW() - INTERVAL '1 hour'),

  -- P3 — medium, SLA 24 hours
  ('a3000001-0000-0000-0000-000000000006',
   'UPS APC 3000VA battery health degraded',
   'UPS battery at 62% capacity. Recommend replacement before next maintenance window to ensure DC power redundancy.',
   'P3', 'open',
   'a1000001-0000-0000-0000-000000000007',
   'a2000001-0000-0000-0000-000000000008',
   NULL,
   NOW() + INTERVAL '20 hours',
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

  ('a3000001-0000-0000-0000-000000000007',
   'GitLab license expiring in 30 days',
   'GitLab EE Premium license for 50 seats expires 2024-06-30. Renewal process must be initiated.',
   'P3', 'open',
   'a1000001-0000-0000-0000-000000000003',
   'a2000001-0000-0000-0000-000000000011',
   NULL,
   NOW() + INTERVAL '22 hours',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  ('a3000001-0000-0000-0000-000000000008',
   'WiFi AP on Floor 3 offline',
   'Aruba AP-635 on Office-Floor3 went inactive 6 hours ago. Users on that floor reporting connectivity issues.',
   'P3', 'in_progress',
   'a1000001-0000-0000-0000-000000000004',
   'a2000001-0000-0000-0000-000000000020',
   NULL,
   NOW() + INTERVAL '18 hours',
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '1 hour'),

  ('a3000001-0000-0000-0000-000000000009',
   'Palo Alto firewall certificate expiry',
   'SSL certificate on PA-3220 DMZ interface expires in 14 days. Renewal and re-push required.',
   'P3', 'open',
   'a1000001-0000-0000-0000-000000000005',
   'a2000001-0000-0000-0000-000000000018',
   NULL,
   NOW() + INTERVAL '19 hours',
   NOW() - INTERVAL '5 hours', NOW() - INTERVAL '5 hours'),

  ('a3000001-0000-0000-0000-000000000010',
   'Microsoft 365 subscription renewal pending',
   'M365 Business Standard (25 seats) expires 2024-05-31. Finance approval for renewal PO is outstanding.',
   'P3', 'open',
   'a1000001-0000-0000-0000-000000000006',
   'a2000001-0000-0000-0000-000000000013',
   NULL,
   NOW() + INTERVAL '21 hours',
   NOW() - INTERVAL '8 hours', NOW() - INTERVAL '8 hours'),

  -- P4 — low, SLA 72 hours
  ('a3000001-0000-0000-0000-000000000011',
   'Carol MacBook keyboard intermittent fault',
   'User Carol Agent reports some keys on MBP keyboard unresponsive after liquid spill. Laptop is still usable.',
   'P4', 'open',
   'a1000001-0000-0000-0000-000000000007',
   'a2000001-0000-0000-0000-000000000005',
   NULL,
   NOW() + INTERVAL '68 hours',
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours'),

  ('a3000001-0000-0000-0000-000000000012',
   'RHEL 9 security patch cycle overdue',
   'Red Hat Enterprise Linux 9 on Cisco UCS has not received security patches for 45 days. Schedule patching.',
   'P4', 'open',
   'a1000001-0000-0000-0000-000000000003',
   'a2000001-0000-0000-0000-000000000010',
   NULL,
   NOW() + INTERVAL '70 hours',
   NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours'),

  ('a3000001-0000-0000-0000-000000000013',
   'ASR router IOS upgrade scheduled',
   'Cisco ASR 1001-X requires IOS XE upgrade from 17.9.3 to 17.12.1 per vendor advisory. Plan for maintenance window.',
   'P4', 'open',
   'a1000001-0000-0000-0000-000000000004',
   'a2000001-0000-0000-0000-000000000017',
   NULL,
   NOW() + INTERVAL '65 hours',
   NOW() - INTERVAL '12 hours', NOW() - INTERVAL '12 hours'),

  ('a3000001-0000-0000-0000-000000000014',
   'Eve laptop docking station not charging',
   'Dell Latitude 5540 for Eve does not charge via the WD22TB4 docking station. Works on direct USB-C.',
   'P4', 'open',
   'a1000001-0000-0000-0000-000000000007',
   'a2000001-0000-0000-0000-000000000007',
   NULL,
   NOW() + INTERVAL '71 hours',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  ('a3000001-0000-0000-0000-000000000015',
   'Ubuntu 22.04 kernel update reboot required',
   'DC-Rack-A1 server has a pending kernel update requiring reboot. Schedule during low-traffic window.',
   'P4', 'resolved',
   'a1000001-0000-0000-0000-000000000005',
   'a2000001-0000-0000-0000-000000000009',
   NOW() - INTERVAL '1 day' + INTERVAL '3 hours',
   NOW() - INTERVAL '1 day' + INTERVAL '72 hours',
   NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '3 hours');

-- ── Incident Events ───────────────────────────────────────────────────────────
INSERT INTO tenant_a.incident_events (incident_id, actor_id, event_type, payload) VALUES
  -- INC-001: DB unreachable (resolved)
  ('a3000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003',
   'status_change',   '{"from":"open","to":"in_progress","note":"Investigating PostgreSQL node"}'),
  ('a3000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003',
   'comment',         '{"body":"OOM killer terminated postgres process. Restarting and investigating memory limits."}'),
  ('a3000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000001',
   'assignment',      '{"assigned_to":"a1000001-0000-0000-0000-000000000003","note":"Senior DBA on call"}'),
  ('a3000001-0000-0000-0000-000000000001', 'a1000001-0000-0000-0000-000000000003',
   'resolution',      '{"body":"Postgres restarted. Root cause: memory limit too low in K8s pod spec. Updated limits and committed fix.","duration_min":45}'),

  -- INC-002: Switch failure (in_progress)
  ('a3000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000001',
   'status_change',   '{"from":"open","to":"in_progress"}'),
  ('a3000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000004',
   'comment',         '{"body":"Failover to Catalyst 9300 #2 partially restored connectivity. Investigating root cause on primary."}'),
  ('a3000001-0000-0000-0000-000000000002', 'a1000001-0000-0000-0000-000000000004',
   'priority_change', '{"from":"P2","to":"P1","reason":"Scope expanded — entire DC affected, not just one rack"}'),

  -- INC-003: FortiGate (in_progress)
  ('a3000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003',
   'comment',         '{"body":"Restarted FortiGate management daemon. Memory utilisation dropped to 71% temporarily."}'),
  ('a3000001-0000-0000-0000-000000000003', 'a1000001-0000-0000-0000-000000000003',
   'status_change',   '{"from":"open","to":"in_progress"}'),

  -- INC-008: AP Floor 3 (in_progress)
  ('a3000001-0000-0000-0000-000000000008', 'a1000001-0000-0000-0000-000000000004',
   'comment',         '{"body":"AP is powered off via PoE. Will replace PoE injector and test."}'),
  ('a3000001-0000-0000-0000-000000000008', 'a1000001-0000-0000-0000-000000000004',
   'status_change',   '{"from":"open","to":"in_progress"}'),

  -- INC-015: Ubuntu reboot (resolved)
  ('a3000001-0000-0000-0000-000000000015', 'a1000001-0000-0000-0000-000000000005',
   'status_change',   '{"from":"open","to":"in_progress","note":"Scheduled maintenance window at 02:00 UTC"}'),
  ('a3000001-0000-0000-0000-000000000015', 'a1000001-0000-0000-0000-000000000005',
   'resolution',      '{"body":"Kernel updated to 6.5.0-35-generic. System rebooted cleanly. All services healthy.","duration_min":12}');
