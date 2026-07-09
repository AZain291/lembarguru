-- 0008_app_settings.sql
-- Tabel key-value generik untuk pengaturan global yang bukan milik satu
-- tier/order/promo tertentu. Dipakai pertama kali untuk persentase komisi
-- referral (sebelumnya hardcode REFERRAL_REWARD_PERCENT di
-- src/utils/subscription.ts) -- lihat src/utils/settings.ts.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value)
values ('referral_commission_percent', '10')
on conflict (key) do nothing;
