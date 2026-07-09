# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Apa ini

LembarGuru (lembarguru.com) — SaaS generator soal ujian untuk guru Indonesia
via Anthropic API (`claude-sonnet-4-6`), sesuai Kurikulum Merdeka, K-13,
atau Cambridge. Guru memilih mapel, kelas, fase Capaian Pembelajaran (CP),
tingkat kesulitan, dan tipe soal → AI menyusun soal + kunci jawaban →
ekspor ke `.docx`. Bisa dipakai sebagai tamu (kuota cookie-based) atau
user login (tier `free`/`pro`/`guru`), berlangganan lewat Midtrans. Selain
generator utama, ada suite "Alat Bantu Guru" (18 tool ringan: RPP, bank
soal, flashcard, dst) dan blog artikel. UI, prompt AI, dan komentar kode
mayoritas Bahasa Indonesia.

Filosofi produk: **simple seperti Google, tapi powerful** — halaman utama
langsung menyodorkan generator (mirip search box Google), bukan landing
page panjang. Perubahan apa pun harus menjaga kesederhanaan ini.

## Commands

```
npm run dev      # dev server (localhost:3000)
npm run build    # production build — WAJIB lulus sebelum commit, beberapa
                  # error (tipe, lint-as-error) cuma muncul di build, bukan di dev
npm run start     # jalankan hasil build
npm run lint      # next lint (eslint-config-next, flat config eslint.config.mjs)
npx tsc --noEmit  # type-check tanpa build penuh, lebih cepat untuk iterasi
```

Tidak ada test suite (tidak ada script `test`, tidak ada file test).

## Stack

- **Next.js 14** (App Router), React 18, TypeScript strict. Path alias `@/*` → `src/*`.
- **Supabase** — auth + Postgres. Tiga client: `utils/supabase/client.ts`
  (browser), `server.ts` (cookie-based, route handler/server component),
  `admin.ts` (service-role, bypass RLS — cuma dipakai di server code
  tepercaya: webhook, cron, endpoint admin).
- **Anthropic SDK** — generate soal (`claude-sonnet-4-6`).
- **Midtrans** (`midtrans-client`) — pembayaran Snap, gateway Indonesia.
- **Resend** — email transaksional (konfirmasi bayar, reminder expiry).
- **`docx`** — export Word.
- **Tailwind v4** — **HANYA** aktif di `/tools/**` lewat `src/app/tools/tools.css`
  (di-`@import` dari `src/app/tools/layout.tsx`), sengaja tidak ditaruh di
  `globals.css` supaya landing page/LembarGuruApp/admin/checkout tidak ikut
  memuat CSS Tailwind yang tak mereka pakai. Halaman-halaman itu pakai CSS
  biasa: `globals.css` (reset minimal, dibungkus `@layer base` — unlayered
  CSS selalu menang atas layered walau lebih rendah specificity, jadi
  reset HARUS di dalam layer supaya tidak mengalahkan utility Tailwind di
  `/tools`), `page.css` (landing, prefix class `lg-`), dan inline style
  object di komponen (`LembarGuruApp.tsx`, `admin/page.tsx`).
- Deploy ke **Vercel** lewat GitHub. `vercel.json` cuma menjadwalkan satu
  cron: `/api/cron/check-subscriptions` (00:00 UTC tiap hari — downgrade
  otomatis tier pro/guru yang `tier_expires_at`-nya lewat, kirim email
  reminder expiry). `/api/cron/reset-quota` ADA di kode tapi tidak
  dijadwalkan dan sekarang dead code (operasi ke tabel `usage_quotas` yang
  tidak pernah dibuat — kuota dihitung live dari `usage_logs`, lihat bagian
  Identitas & Kuota).

Environment variables didokumentasikan di `.env.example`. Yang dipakai di
kode tapi **tidak** ada di `.env.example`: `CRON_SECRET` (proteksi
`/api/cron/*`), `RESEND_API_KEY`.

## Aturan penting

1. **Tailwind cuma untuk `/tools/**`** (lihat Stack di atas). Jangan
   menambah Tailwind/util class Tailwind ke halaman lain.
2. **Jangan pernah commit `.env.local`** atau kredensial apa pun.
3. **Midtrans: pakai Sandbox saat development** (`MIDTRANS_IS_PRODUCTION=false`).
   Jangan test dengan kredensial production.
4. **Surgical edits, bukan rewrite.** Baca file asli, buat perubahan
   sekecil mungkin yang menyelesaikan masalah. Rewrite penuh hanya kalau
   patch sudah menumpuk terlalu banyak error.
5. **Konfirmasi skema dulu.** Jangan berasumsi soal nama tabel/kolom — baca
   migrasi di `src/utils/supabase/migrations/` atau `src/docs/supabase_migration.sql`.
   Beberapa migration di folder itu belum tentu sudah dijalankan di Supabase
   production — kalau sebuah fitur bergantung padanya, ingatkan user untuk
   menjalankannya lewat Supabase SQL Editor (lihat bagian Skema).
6. **Commit/push cuma kalau diminta eksplisit.** Tidak ada branch/PR flow
   yang dipakai di repo ini — riwayat commit menunjukkan semua langsung ke
   `main`. Ikuti perilaku itu (commit & push ke `main` setelah user minta
   eksplisit), jangan berinisiatif push sendiri.
7. **Domain kanonik SEO adalah non-www** (`https://lembarguru.com`, sama
   dengan `metadataBase` di `layout.tsx`). `next.config.js` sudah redirect
   301 `www` → non-www. Halaman publik baru yang butuh interaktivitas (jadi
   harus `"use client"`) TIDAK BISA `export const metadata` langsung —
   pola yang dipakai di repo ini: pisah jadi `page.tsx` (server component,
   isinya cuma metadata + render child) dan `{Nama}Client.tsx` (component
   client sebenarnya) — lihat `src/app/harga/`, `src/app/referral/`, atau
   `src/app/coba-gratis/` sebagai contoh. Halaman yang wajib login (tidak
   ada konten publik buat Googlebot) diberi `robots: { index: false }`
   dan TIDAK dimasukkan ke `src/app/sitemap.ts`.

## Struktur folder (ringkas)

```
src/
  app/
    page.tsx / page.css     landing + entry point generator (client component)
    layout.tsx globals.css  metadata SEO, font, reset (@layer base)
    admin/                  panel admin (lihat bagian Admin Panel)
    blog/ blog/[slug]/      artikel statis (generateStaticParams)
    tools/                  18 route statis /tools/{slug}, masing-masing
                             folder terpisah (BUKAN next/dynamic — sudah
                             dicoba, tidak benar-benar code-split di App
                             Router + shared lookup-map; verifikasi lewat
                             isi .next/static/chunks kalau ragu)
    coba-gratis/             generator standalone terpisah untuk tamu (form
                             sendiri, TIDAK reuse LembarGuruApp.tsx)
    checkout/                 alur checkout embedded-popup (lihat Alur Pembayaran)
    login/ register/ dashboard/ auth/ about/ contact/ terms/
    api/                     lihat sub-bagian di bawah tiap fitur
  components/
    LembarGuruApp.tsx        UI generator utama + toolbar Alat Bantu Guru
                             (1700+ baris, dipakai HANYA dari app/page.tsx)
    tools/                   1 file per tool guru + ToolIcon.tsx (18 ikon SVG
                             inline, keyed by slug), ToolPageShell.tsx,
                             ToolThemeWrapper.tsx
    ui/ forms/               komponen generik
  lib/
    teacherTools.ts          TEACHER_TOOLS -- satu sumber daftar tool (dipakai
                             toolbar & metadata halaman /tools/[slug])
    subjectOptions.ts        MAPEL, KELAS_LIST, SD_TEMA, getMapelOptions() --
                             satu sumber mapel/kelas untuk form generator DAN
                             dropdown pengaturan Bank Soal di admin
    blog.ts                  BLOG_ARTICLES (seed statis)
    referral.ts               helper tabel referrals/referral_redemptions
    types.ts
  utils/
    usage.ts                 identitas & kuota (lihat bagian tersendiri)
    subscription.ts           upgradeUserForOrder/downgradeUserForOrder --
                             dipakai BERSAMA oleh webhook & admin manual
    soalBank.ts                logic Bank Soal (splitSoalBlocks, limit per tier)
    admin.ts                  requireAdmin()
    pricing.ts promo.ts        helper harga/promo (lihat catatan duplikasi di
                             bagian Alur Pembayaran)
    midtrans.ts resend.ts aiJson.ts
    supabase/                 client.ts server.ts admin.ts migrations/
  middleware.ts               refresh sesi Supabase + mint cookie guest_id
                             httpOnly di hampir semua request
```

## Identitas & kuota (`src/utils/usage.ts`)

Gerbang di depan tiap generate. Empat tier: `guest | free | pro | guru`.

- `getIdentity()` — kalau ada user Supabase login, baca `profiles.tier`/
  `tier_expires_at` (auto-downgrade ke `free` di server kalau sudah lewat
  expiry). Kalau tidak, pakai cookie `guest_id` dari middleware.
- `getDynamicTierLimits()` — limit per tier dari tabel `pricing_tiers`
  (admin-editable lewat `/api/admin/pricing`), fallback ke `TIER_LIMITS`
  hardcoded kalau DB kosong/error. Dua cap independen: `maxPerPeriod`
  (soal/hari) dan `maxSoal` (soal per satu request generate).
- `checkQuota()`/`logUsage()` — kuota harian dihitung ulang tiap kali
  dengan menjumlah `usage_logs.questions_count` hari ini (waktu lokal
  server), key `user_id` atau `guest_token`. **Tidak ada kolom counter
  terpisah** — jangan cari/asumsikan tabel `usage_quotas`, itu tidak ada.
  Untuk tamu, key-nya `guest_token` ATAU `ip_hash` (kolom dari migration
  0009, dihitung di `src/utils/ip.ts` dari header `x-forwarded-for`) —
  supaya kuota tamu tidak trivial di-reset cuma dengan clear cookie/
  incognito (jaringan/IP yang sama tetap kena kuota gabungan). `questions_count`
  sendiri juga tidak ada di `supabase_migration.sql`/manapun di
  `migrations/` walau dipakai di sini — sudah ada di DB production
  (kemungkinan ditambah manual di masa lalu), bukan sesuatu yang perlu
  dimigrasikan ulang.
- `/api/generate` cek kedua cap sebelum panggil Anthropic, bangun prompt
  Indonesia spesifik per tipe soal (termasuk mode `campuran` lewat
  `mixedConfig`), lalu `logUsage()` dan kembalikan sisa kuota terbaru.

## Skema database (Supabase)

Sumber kebenaran: `src/docs/supabase_migration.sql` (base schema) + file
bernomor di `src/utils/supabase/migrations/` (0002–0006, tiap file
inkremental, **belum tentu semua sudah dijalankan di production** — cek
dengan user kalau sebuah fitur tampak tidak berfungsi padahal kodenya
benar; gejalanya biasanya error Supabase "Could not find the 'X' column
... in the schema cache").

Tabel yang ADA: `profiles` (`tier`, `tier_expires_at`, plus `name`/`phone`/
`email`, `updated_at` dari migration 0005), `usage_logs`, `pricing_tiers`
(base + kolom Bank Soal dari 0006: `bank_soal_jumlah`, `bank_soal_acak`,
`bank_soal_mapel`, `bank_soal_kelas`; juga admin-editable baris `tier =
'guest'` yang membuat kuota harian tamu jadi bisa diatur lewat tab "Harga
& Kuota"), `orders` (base + `promo_code_id`, `discount_amount`,
`updated_at` dari 0003 — nama kolom `promo_code_id`, BUKAN `promo_id`),
`promo_codes`, `referrals`, `referral_redemptions` (0002, + kolom `paid_at`
dari 0007 — lihat bagian Referral), `generated_soal` (0004, kolom `hidden`
dari 0006 — pool bersama untuk fitur Bank Soal, lihat bagian tersendiri).

Tabel yang TIDAK ADA (jangan referensikan): `usage_quotas`, `plans`,
`transactions`, `subscriptions`.

RLS aktif di tabel user-facing. Operasi server yang perlu bypass RLS
(webhook, cron, endpoint admin) pakai `createAdminClient()`.

## Alur pembayaran (Midtrans)

Ada **dua implementasi checkout independen**, dua-duanya fungsional
terhadap API saat ini:

- **Alur utama** (dipakai dari UI): `LembarGuruApp.tsx`'s `UpgradeModal` →
  `POST /api/payment/create-transaction` → respons `{ redirect_url,
  order_id }` → `window.location.href = redirect_url` (halaman checkout
  ter-hosting Midtrans, bukan popup embed). Endpoint ini bikin instance
  `midtransClient.Snap` sendiri, insert `orders` (`promo_code_id`,
  `discount_amount`, `status: 'pending'`), increment
  `promo_codes.used_count` lewat RPC `increment_promo_used_count` **saat
  checkout dibuat, sebelum pembayaran dikonfirmasi**.
- **`/checkout?plan=&cycle=`** (`src/app/checkout/page.tsx`) — **tidak
  ditautkan dari navigasi manapun** (cuma bisa diakses lewat URL
  langsung), tapi sudah konsisten dengan API saat ini (pakai
  `redirect_url` yang sama, bukan `snap.pay(token)` popup lagi). Kalau
  suatu saat mau ditautkan ke navigasi, cek dulu masih sinkron dengan
  `create-transaction/route.ts`.
- `POST /api/payment/webhook` verifikasi signature Midtrans
  (`sha512(order_id+status_code+gross_amount+MIDTRANS_SERVER_KEY)`),
  idempotent lewat cek `order.status` sudah final. **Urutan penting:**
  upgrade tier (`upgradeUserForOrder`, `src/utils/subscription.ts`) DULU,
  baru tandai `orders.status = 'success'` — kalau dibalik dan upgrade
  gagal, order akan terkunci permanen kelihatan sukses padahal tier user
  tidak pernah naik. Helper yang sama (`upgradeUserForOrder`/
  `downgradeUserForOrder`) dipakai juga oleh tombol manual "Tandai
  Sukses"/"Batalkan" di admin tab Transaksi (`/api/admin/orders`), supaya
  dua jalur ini tidak bisa saling tidak sinkron. `upgradeUserForOrder`
  juga memanggil `markReferralSuccess` untuk reward referral.
- **Validasi promo ada 3 implementasi terpisah** (kode smell, bukan bug
  aktif): `src/utils/pricing.ts:validatePromoCode()` (tidak dipakai route
  manapun), `src/utils/promo.ts:validatePromoInternal()` (dipakai
  `/api/promos/validate`, dipanggil dari `/checkout`), dan
  `/api/public/promos/validate` `POST` (implementasi inline sendiri,
  dipanggil dari `UpgradeModal` alur utama). `create-transaction/route.ts`
  re-validasi promo SEKALI LAGI (implementasi ke-4) saat charge — ini yang
  menentukan harga final, jadi validasi client cuma soal preview, bukan
  celah bypass harga.
- Harga & diskon diatur di admin (`pricing_tiers`, `promo_codes`), Midtrans
  cuma menerima `gross_amount` final.

## Bank Soal (`src/utils/soalBank.ts`, `/api/bank-soal`)

Kolam soal bersama dari hasil generate SEMUA user (`generated_soal`,
diisi otomatis tiap kali `/api/generate` sukses — insert error di sana
DICEK eksplisit dan di-`console.error`, karena Supabase JS client **tidak
throw** pada query error, jadi `try/catch` polos tidak pernah menangkapnya).

- Tiap tier (`guest`/`free`/`pro`) punya limit tampil yang admin-atur lewat
  tab "🗂️ Bank Soal": `jumlah` (berapa soal), `acak` (diacak atau ambil N
  terbaru), `mapel`/`kelas` (opsional, batasi ke satu mapel/kelas —
  `null` = semua). Tier `guru` selalu tanpa batas.
- `getBankSoalLimits()` baca dari kolom `bank_soal_*` di `pricing_tiers`,
  fallback ke `BANK_SOAL_DEFAULTS` kalau migration 0006 belum jalan.
- `/api/bank-soal` GET terapkan filter itu, kembalikan `{ tier, soal,
  mapel, kelas }` — client (`BankSoal.tsx`) pakai `mapel`/`kelas` untuk
  menampilkan pesan pembatasan yang sesuai.
- Admin bisa moderasi (`hidden` boolean, bukan hard delete kecuali pilih
  hapus permanen) lewat `/api/admin/generated-soal`.

## Mapel & kelas (`src/lib/subjectOptions.ts`)

Satu sumber untuk form generator (`LembarGuruApp.tsx`) dan dropdown
pengaturan Bank Soal (admin). `getMapelOptions(kurikulum, kelas)`
menggabungkan dua filter:
- **Kurikulum** — Cambridge cuma dapat mapel umum (tanpa PKn/Sejarah/
  Pendidikan Agama/mapel Kemenag/SMK); Merdeka & K-13 dapat daftar penuh.
- **Jenjang** (diturunkan dari suffix `kelas`, urutan cek SMA/SMK sebelum
  MA karena string-nya tumpang tindih) — mapel Kemenag (Fikih dkk) cuma
  untuk MTs/MA, mapel SMK cuma untuk SMK, Biologi/Fisika/Kimia/Sejarah
  disembunyikan untuk SD/SMP/MTs (masih IPA/IPS terpadu di sana), IPA
  disembunyikan untuk SMA/MA/SMK (sudah pecah jadi mapel sains terpisah).

`SD_TEMA` — daftar tema tematik terpadu resmi (Buku Tematik Kemendikbud)
per kelas SD 1–6, opsional di form: kalau dipilih, digabung ke field
`topik` yang dikirim ke `/api/generate` (backend tidak tahu konsep
"tema", cuma terima string topik).

## Admin panel (`src/app/admin/page.tsx`)

Client-rendered, satu halaman dengan tab: Statistik, Harga & Kuota
(`pricing_tiers`, termasuk kuota generate harian), Promo (`promo_codes`),
Users (termasuk set manual `tier_expires_at` per user), Transaksi
(`orders`, tombol Tandai Sukses/Batalkan lewat `upgradeUserForOrder`/
`downgradeUserForOrder`), Bank Soal (pengaturan tampil per tier +
moderasi `generated_soal`), Referral (lihat bagian Referral), Tool
(matrix checkbox tier×tool -- kolom `pricing_tiers.enabled_tools` jsonb,
migration 0010, `null` = semua tool diizinkan). `/api/usage` meneruskan
`enabledTools` tier user saat ini; `LembarGuruApp.tsx` memakainya untuk
menampilkan tool yang tidak diizinkan dalam kondisi abu-abu/nonaktif
(klik membuka `UpgradeModal`, bukan navigasi ke `/tools/{slug}`) --
**cuma proteksi UI**, halaman `/tools/{slug}` sendiri belum ada
pengecekan tier di server, jadi URL tetap bisa diakses langsung kalau
tahu slug-nya.

Otorisasi: `requireAdmin()` (`src/utils/admin.ts`) — email user login
harus persis sama dengan `process.env.ADMIN_EMAIL`. Tidak ada role table.
Dicek di semua route `/api/admin/*` termasuk `/api/admin/promos`.

## Auth

Dua entry point signup independen: `src/app/login/page.tsx` (toggle
login/register inline, upsert `profiles` langsung dari browser client,
**tidak** menangkap kode referral) dan `src/app/register/page.tsx`
(dedicated, tangkap `?ref=` ke localStorage, redeem lewat
`/api/referral/redeem` setelah signup). Kalau menyentuh alur referral,
ingat cuma jalur `/register` yang mewarisi kode referral.

## Referral

Kode referral dibuat LAZY, bukan saat signup: `GET /api/referral/me`
(dipanggil dari view "Akun Saya" di `LembarGuruApp.tsx` saat pertama kali
dibuka) — kalau user login belum punya baris `referrals`, endpoint ini
generate kode acak dan insert-kan, baru kembalikan `{ code, successCount,
totalReward, unpaidReward }`. `ReferralBanner.tsx` menampilkan kode itu +
ringkasan reward-nya.

Reward (10% harga paket, `REFERRAL_REWARD_PERCENT` di
`src/utils/subscription.ts`) ditandai `status='success'` otomatis oleh
`markReferralSuccess()` saat referred user bayar pertama kali — TAPI ini
cuma pencatatan, bukan pembayaran nyata (keputusan produk: reward
dibayar manual di luar sistem, bukan otomatis lewat wallet/kredit/promo
code). Kolom `paid_at` di `referral_redemptions` (migration 0007)
melacak status transfer manual itu, diatur lewat tab admin "🎁 Referral"
(`/api/admin/referrals`, tombol Tandai Dibayar/Batalkan) — terpisah dari
`reward_given` yang cuma berarti "redemption ini sukses & reward-nya
sudah dihitung".

## Cara verifikasi sebelum selesai

- `npx tsc --noEmit` untuk cek cepat, lalu `npm run build` (hapus `.next`
  dulu kalau curiga cache basi) — HARUS lulus sebelum commit, beberapa
  error (termasuk error accessibility ESLint) cuma muncul di build.
- Setelah ubah styling/layout global (`globals.css`, `page.css`, style
  inline di `LembarGuruApp.tsx`), cek halaman `/admin`, `/dashboard`,
  `/login`, `/tools/*` masih normal — jangan sampai perubahan di satu
  halaman merusak halaman lain (lihat catatan CSS Cascade Layers di
  bagian Stack).
- Commit message jelas dan spesifik dalam Bahasa Indonesia.
