-- 0003_orders_promo_fields.sql
-- orders (dari supabase_migration.sql) cuma punya: order_id, user_id, tier,
-- period, amount, status, paid_at, created_at. Kolom di bawah ini dipakai
-- oleh create-transaction/route.ts (promo_code_id, discount_amount) dan
-- webhook/route.ts (updated_at) tapi belum pernah dibuat lewat migration
-- manapun -- itu sebabnya insert/update order sebelumnya gagal (kolom tidak
-- ada). Nama kolom di sini SENGAJA disamakan persis dengan yang dipakai kode
-- saat ini (promo_code_id, bukan promo_id) -- kalau kode berubah, migration
-- ini harus ikut disesuaikan.

alter table public.orders
  add column if not exists discount_amount int not null default 0,
  add column if not exists promo_code_id   uuid references public.promo_codes(id),
  add column if not exists updated_at      timestamptz not null default now();

create index if not exists idx_orders_promo_code_id on public.orders(promo_code_id);

-- create-transaction/route.ts panggil RPC ini lewat admin.rpc(), tapi errornya
-- tidak pernah dicek -- tanpa fungsi ini, used_count promo diam-diam tidak
-- pernah bertambah.
create or replace function public.increment_promo_used_count(promo_id uuid)
returns void language sql as $$
  update public.promo_codes set used_count = used_count + 1 where id = promo_id;
$$;
