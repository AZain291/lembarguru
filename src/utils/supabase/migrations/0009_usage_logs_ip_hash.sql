-- 0009_usage_logs_ip_hash.sql
-- Sinyal kuota tambahan untuk tamu: guest_id cookie trivial di-reset
-- (clear cookie / mode incognito), jadi kuota harian tamu sekarang juga
-- dicek lewat hash IP request (lihat src/utils/ip.ts, dipakai di
-- checkQuota/logUsage di src/utils/usage.ts). Simpan HASH-nya saja, bukan
-- IP mentah.
alter table public.usage_logs
  add column if not exists ip_hash text;

create index if not exists idx_usage_logs_ip_hash on public.usage_logs(ip_hash);
