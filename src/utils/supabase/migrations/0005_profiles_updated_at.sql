-- 0005_profiles_updated_at.sql
-- KRITIS: profiles.updated_at didefinisikan di supabase_migration.sql, tapi
-- ternyata TIDAK ADA di tabel production sebenarnya (terlihat dari error
-- PostgREST "Could not find the 'updated_at' column of 'profiles' in the
-- schema cache" saat mencoba upgrade tier lewat webhook maupun tombol
-- "Tandai Sukses" di admin). Kolom ini ditulis di 4 tempat berbeda tanpa
-- pengecekan sebelumnya (src/utils/subscription.ts, src/app/api/admin/
-- users/route.ts, src/app/api/cron/check-subscriptions/route.ts) -- kalau
-- kolomnya tidak ada, update SELURUH baris gagal (bukan cuma updated_at-nya),
-- jadi tier/tier_expires_at pun ikut tidak pernah tersimpan. Ini kemungkinan
-- besar penyebab utama tier tidak pernah naik setelah pembayaran.

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();
