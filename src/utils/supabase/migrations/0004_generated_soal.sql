-- 0004_generated_soal.sql
-- Tabel "kolam" Bank Soal bersama -- setiap soal individual yang berhasil
-- di-generate lewat /api/generate disimpan di sini (dipecah per nomor soal,
-- lihat src/utils/soalBank.ts:splitSoalBlocks), lalu ditampilkan lagi ke
-- SEMUA user (bukan cuma yang generate) lewat /api/bank-soal, dibatasi per
-- tier. Guest juga boleh baca (5 soal/hari dari satu mapel yang bergilir
-- per hari), makanya user_id nullable dan tidak ada kepemilikan personal.

create table if not exists public.generated_soal (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete set null,
  mapel      text not null,
  kelas      text,
  kurikulum  text,
  tipe       text,
  teks       text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_generated_soal_mapel      on public.generated_soal(mapel);
create index if not exists idx_generated_soal_created_at on public.generated_soal(created_at);

alter table public.generated_soal enable row level security;
drop policy if exists "Anyone can read generated soal" on public.generated_soal;
create policy "Anyone can read generated soal" on public.generated_soal
  for select using (true);
-- Insert hanya lewat service role (dari /api/generate), tidak ada policy insert untuk anon/authenticated.
