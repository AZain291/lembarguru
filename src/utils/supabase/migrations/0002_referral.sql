-- supabase/migrations/0002_referral.sql — v2
-- HANYA tabel referral. promo_codes dan pricing_tiers TIDAK disentuh —
-- keduanya sudah ada dan sudah dipakai src/utils/promo.ts, src/utils/pricing.ts,
-- src/app/admin/page.tsx. Migration 0001 dari sesi sebelumnya (yang bikin ulang
-- promo_codes/pricing_tiers/guest_quota_settings) DIBUANG — jangan dijalankan,
-- akan bentrok/redundan dengan tabel yang sudah ada.

create table if not exists referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists idx_referrals_code on referrals (upper(code));

create table if not exists referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references referrals(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade unique,
  status text not null default 'pending' check (status in ('pending','success','cancelled')),
  reward_given boolean not null default false,
  reward_amount integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table referrals enable row level security;
alter table referral_redemptions enable row level security;

create policy "referrals_own_read" on referrals
  for select using (auth.uid() = referrer_user_id);

create policy "referral_redemptions_own_read" on referral_redemptions
  for select using (
    auth.uid() in (
      select referrer_user_id from referrals where referrals.id = referral_redemptions.referral_id
    )
  );

-- Insert/update (redeem, reward_given) dilakukan lewat API route dengan
-- service role (src/utils/supabase/admin.ts), bukan langsung dari client.
