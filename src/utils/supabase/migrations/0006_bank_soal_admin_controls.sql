-- 0006_bank_soal_admin_controls.sql
-- (1) Moderasi: admin bisa menyembunyikan soal tertentu dari Bank Soal
--     tanpa menghapusnya (bisa ditampilkan lagi kapan saja).
alter table public.generated_soal
  add column if not exists hidden boolean not null default false;

create index if not exists idx_generated_soal_hidden on public.generated_soal(hidden);

-- (2) Pengaturan tampilan Bank Soal per tier: jumlah total soal yang
--     tampil, filter mata pelajaran & kelas (null/kosong = "Semua"), dan
--     apakah diacak atau tidak. Guru tetap tanpa batas by design, tidak
--     butuh kolom ini.
alter table public.pricing_tiers
  add column if not exists bank_soal_jumlah int,
  add column if not exists bank_soal_acak   boolean not null default true,
  add column if not exists bank_soal_mapel  text,
  add column if not exists bank_soal_kelas  text;

-- Baris 'guest' belum pernah ada di pricing_tiers (lihat catatan di
-- src/utils/usage.ts -- akibatnya kuota generate harian tamu SELAMA INI
-- selalu hardcode fallback, tidak pernah bisa diatur admin). Menambahkannya
-- di sini sekaligus menutup celah itu: setelah migration ini, tab "Harga &
-- Kuota" di admin juga bisa mengatur kuota generate harian tamu, bukan cuma
-- jumlah Bank Soal-nya. Nilai default persis sama dengan fallback hardcode
-- yang sudah berjalan sekarang, jadi TIDAK mengubah perilaku apa pun sampai
-- admin sengaja mengubahnya.
insert into public.pricing_tiers (tier, label, price_monthly, price_yearly, active, max_soal, max_gen_per_day, unlimited_gen)
values ('guest', 'Tamu', 0, 0, true, 5, 10, false)
on conflict (tier) do nothing;

update public.pricing_tiers set bank_soal_jumlah = 10, bank_soal_acak = true  where tier = 'guest' and bank_soal_jumlah is null;
update public.pricing_tiers set bank_soal_jumlah = 25, bank_soal_acak = true  where tier = 'free'  and bank_soal_jumlah is null;
update public.pricing_tiers set bank_soal_jumlah = 50, bank_soal_acak = false where tier = 'pro'   and bank_soal_jumlah is null;
