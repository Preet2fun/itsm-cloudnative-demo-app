-- Seed: tenant_c  (StartupNest Ltd)
-- Description: Minimal dataset — 5 users, 5 assets, 3 incidents.
--              Represents a small tenant to validate HPA scale-down and
--              that data isolation holds across tenants of different sizes.
-- Run AFTER all migrations and after create_tenant_schema('tenant_c') has been called.

SET search_path TO tenant_c, public;

-- ── Register tenant ───────────────────────────────────────────────────────────
INSERT INTO public.tenants (id, name, slug, is_active)
VALUES ('c0000000-0000-0000-0000-000000000001', 'StartupNest Ltd', 'tenant_c', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ── Users ─────────────────────────────────────────────────────────────────────
INSERT INTO tenant_c.users (id, email, password_hash, full_name, role) VALUES
  ('c1000001-0000-0000-0000-000000000001', 'wendy.admin@startupnest.io',
   '$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C', 'Wendy Admin',  'admin'),
  ('c1000001-0000-0000-0000-000000000002', 'xavier.agent@startupnest.io',
   '$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C', 'Xavier Agent', 'agent'),
  ('c1000001-0000-0000-0000-000000000003', 'yuki.agent@startupnest.io',
   '$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C', 'Yuki Agent',   'agent'),
  ('c1000001-0000-0000-0000-000000000004', 'zane.viewer@startupnest.io',
   '$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C', 'Zane Viewer',  'viewer'),
  ('c1000001-0000-0000-0000-000000000005', 'anna.viewer@startupnest.io',
   '$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C', 'Anna Viewer',  'viewer');

-- ── Assets ────────────────────────────────────────────────────────────────────
INSERT INTO tenant_c.assets (id, name, asset_type, serial_number, status, location, assigned_to, purchased_at, warranty_until, metadata) VALUES
  ('c2000001-0000-0000-0000-000000000001', 'Hetzner AX51 Dedicated Server', 'hardware', 'SN-HZ-AX51-001', 'active', 'Hetzner-FSN1-DC14', NULL, '2024-01-01', '2025-01-01',
   '{"provider":"Hetzner","cpu":"AMD Ryzen 7 3700X","ram_gb":64,"nvme_tb":1}'),
  ('c2000001-0000-0000-0000-000000000002', 'MacBook Air M2 — Wendy',        'hardware', 'SN-MBA-001',      'active', 'Remote',            'c1000001-0000-0000-0000-000000000001', '2023-10-01', '2026-10-01',
   '{"model":"MacBook Air 13","chip":"M2","ram_gb":16}'),
  ('c2000001-0000-0000-0000-000000000003', 'GitHub Teams',                  'software', NULL,              'active', 'Cloud-SaaS',        NULL, '2024-01-01', '2024-12-31',
   '{"plan":"Team","seats":10,"license":"annual"}'),
  ('c2000001-0000-0000-0000-000000000004', 'Cloudflare Pro',                'software', NULL,              'active', 'Cloud-SaaS',        NULL, '2024-01-01', '2024-12-31',
   '{"plan":"Pro","zones":3}'),
  ('c2000001-0000-0000-0000-000000000005', 'Hetzner Cloud Load Balancer',   'network',  NULL,              'active', 'Hetzner-FSN1',      NULL, '2024-01-01', NULL,
   '{"type":"LB11","targets":3,"protocol":"HTTP/HTTPS"}');

-- ── Incidents ─────────────────────────────────────────────────────────────────
INSERT INTO tenant_c.incidents (id, title, description, priority, status, assigned_to, related_asset, resolved_at, sla_breach_at, created_at, updated_at) VALUES
  ('c3000001-0000-0000-0000-000000000001',
   'Hetzner dedicated server unreachable via SSH',
   'AX51 server at FSN1-DC14 stopped accepting SSH connections after automated security update. Web services still running via load balancer.',
   'P2', 'in_progress',
   'c1000001-0000-0000-0000-000000000002',
   'c2000001-0000-0000-0000-000000000001',
   NULL,
   NOW() + INTERVAL '2 hours',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),

  ('c3000001-0000-0000-0000-000000000002',
   'GitHub Actions CI pipeline failing on main branch',
   'All pushes to main are failing at the Docker build step since upgrading to actions/checkout@v4. Blocking deploys.',
   'P3', 'open',
   'c1000001-0000-0000-0000-000000000003',
   'c2000001-0000-0000-0000-000000000003',
   NULL,
   NOW() + INTERVAL '22 hours',
   NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours'),

  ('c3000001-0000-0000-0000-000000000003',
   'Cloudflare WAF blocking legitimate API traffic',
   'Cloudflare WAF rule ID 100137 is flagging valid POST requests from mobile clients. False positive rate ~12%.',
   'P3', 'open',
   'c1000001-0000-0000-0000-000000000002',
   'c2000001-0000-0000-0000-000000000004',
   NULL,
   NOW() + INTERVAL '20 hours',
   NOW() - INTERVAL '4 hours', NOW() - INTERVAL '4 hours');

-- ── Incident Events ───────────────────────────────────────────────────────────
INSERT INTO tenant_c.incident_events (incident_id, actor_id, event_type, payload) VALUES
  ('c3000001-0000-0000-0000-000000000001', 'c1000001-0000-0000-0000-000000000001',
   'status_change', '{"from":"open","to":"in_progress"}'),
  ('c3000001-0000-0000-0000-000000000001', 'c1000001-0000-0000-0000-000000000002',
   'comment',       '{"body":"SSH daemon crashed — sshdconfig sshd.service restart failed. Investigating via Hetzner rescue console."}');
