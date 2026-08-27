-- platform-app/database/seeds/seed-platform-users.sql
-- Seeds the one live-tested platform-staff credential into public.users.
-- Same person/password as platform-app/database/seeds/seed-tenant-a.sql's
-- alice.admin row (that row is left alone — see design spec §4.5) — this
-- is the new, additional home for her platform-staff identity.
-- Idempotent: ON CONFLICT DO NOTHING (matches this repo's other seed files).

INSERT INTO public.users (id, email, password_hash, full_name, role, tenant_id) VALUES
  ('b1000001-0000-0000-0000-000000000001', 'alice.admin@globaltech.io',
   '$2b$10$mdPk.j5ma8VJYoHoQyegZu64BGY1AVFR25.3pFk/YZL918gEmxG1C', 'Alice Admin',
   'platform_admin', NULL)
ON CONFLICT (email) DO NOTHING;
