-- 0010_pricing_tiers_enabled_tools.sql
-- Daftar slug tool ("Alat Bantu Guru") yang boleh diakses tier tersebut,
-- diatur admin lewat tab "🧰 Tool" (/api/admin/pricing PATCH). NULL berarti
-- "semua tool diizinkan" (default -- tidak mengubah perilaku apa pun
-- sampai admin sengaja membatasi satu tier).
alter table public.pricing_tiers
  add column if not exists enabled_tools jsonb;
