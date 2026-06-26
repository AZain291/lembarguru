-- ============================================================
-- LembarGuru — Complete Supabase Migration
-- Jalankan di: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── 1. PROFILES ─────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  tier            text not null default 'free' check (tier in ('free','pro','guru')),
  tier_expires_at timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Auto-create profile saat user signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 2. USAGE_LOGS ────────────────────────────────────────────
create table if not exists public.usage_logs (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete set null,
  guest_token text,
  action      text not null default 'generate',
  tokens_used int  not null default 0,
  status      text not null default 'success' check (status in ('success','error')),
  created_at  timestamptz default now()
);

create index if not exists idx_usage_logs_user_id    on public.usage_logs(user_id);
create index if not exists idx_usage_logs_guest_token on public.usage_logs(guest_token);
create index if not exists idx_usage_logs_created_at  on public.usage_logs(created_at);
create index if not exists idx_usage_logs_status       on public.usage_logs(status);

-- ── 3. PRICING_TIERS ─────────────────────────────────────────
create table if not exists public.pricing_tiers (
  tier             text primary key,
  label            text not null,
  price_monthly    int  not null default 0,
  price_yearly     int  not null default 0,
  active           boolean not null default true,
  max_soal         int  not null default 10,
  max_gen_per_day  int,               -- null = unlimited (dikontrol unlimited_gen)
  unlimited_gen    boolean not null default false,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Seed data default tier
insert into public.pricing_tiers (tier, label, price_monthly, price_yearly, active, max_soal, max_gen_per_day, unlimited_gen)
values
  ('free', 'Gratis',        0,      0,      true,  10, 5,    false),
  ('pro',  'Pro',           59000,  499000, true,  20, null, true),
  ('guru', 'Guru Lengkap',  109000, 899000, true,  50, null, true)
on conflict (tier) do nothing;

-- ── 4. PROMO_CODES ───────────────────────────────────────────
create table if not exists public.promo_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  discount_type  text not null check (discount_type in ('percent','fixed')),
  discount_value numeric not null,
  applies_to     text not null default 'all',
  max_uses       int,
  used_count     int not null default 0,
  valid_until    date,
  active         boolean not null default true,
  created_at     timestamptz default now()
);

-- ── 5. ORDERS ────────────────────────────────────────────────
create table if not exists public.orders (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  order_id   text not null unique,
  tier       text not null,
  period     text not null,
  amount     int  not null,
  status     text not null default 'pending' check (status in ('pending','success','failed')),
  paid_at    timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_orders_user_id  on public.orders(user_id);
create index if not exists idx_orders_order_id on public.orders(order_id);

-- ── 6. ROW LEVEL SECURITY ────────────────────────────────────
-- Profiles: user hanya bisa baca profil sendiri
alter table public.profiles enable row level security;
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Usage logs: insert bebas (via service role), select dibatasi
alter table public.usage_logs enable row level security;
drop policy if exists "Service role can do all" on public.usage_logs;
create policy "Service role can do all" on public.usage_logs
  using (true) with check (true);

-- Pricing: semua bisa baca, hanya service role yang bisa update
alter table public.pricing_tiers enable row level security;
drop policy if exists "Anyone can read pricing" on public.pricing_tiers;
create policy "Anyone can read pricing" on public.pricing_tiers
  for select using (true);

-- Promo: semua bisa baca (untuk validasi), service role bisa write
alter table public.promo_codes enable row level security;
drop policy if exists "Anyone can read promos" on public.promo_codes;
create policy "Anyone can read promos" on public.promo_codes
  for select using (true);

-- Orders: user hanya bisa baca order sendiri
alter table public.orders enable row level security;
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders" on public.orders
  for select using (auth.uid() = user_id);

-- ── 7. GRANT SERVICE ROLE ────────────────────────────────────
-- Service role sudah bypass RLS secara default di Supabase
-- Tidak perlu grant tambahan

-- ── SELESAI ──────────────────────────────────────────────────
-- Cek tabel:
-- select * from public.pricing_tiers;
-- select count(*) from public.profiles;
