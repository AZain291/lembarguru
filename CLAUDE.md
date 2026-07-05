# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

LembarGuru — a Next.js (App Router) web app that generates Indonesian school exam questions (soal) via the Anthropic API, aligned to Kurikulum Merdeka or K-13. Users can generate as a guest (cookie-based quota) or a logged-in user (free/pro/guru tiers), export results to `.docx`, and subscribe via Midtrans payments. UI copy, prompts, and DB comments are in Indonesian.

## Commands

```
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run start    # run production build
npm run lint     # next lint (eslint-config-next, flat config in eslint.config.mjs)
```

There is no test suite/runner configured in this repo (no `test` script, no test files).

Environment variables are documented in `.env.example` (Anthropic, Supabase, Midtrans, app URL, admin email). Also referenced in code but **not** in `.env.example`: `CRON_SECRET` (protects `/api/cron/*`), `RESEND_API_KEY` (email sending), `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` (used client-side by the checkout Snap script and, inconsistently, server-side in `create-transaction/route.ts` — see Payments section).

## Architecture

**Stack**: Next.js 14 App Router, React 18, TypeScript (strict), Tailwind v4, Supabase (auth + Postgres), Anthropic SDK (`claude-sonnet-4-6`), Midtrans (payments, Indonesian gateway), Resend (transactional email), `docx` (Word export). Path alias `@/*` → `src/*`.

**Deploy target is Vercel**: `vercel.json` defines a daily cron hitting `/api/cron/check-subscriptions` (downgrades expired pro/guru users to free, sends expiry-reminder emails). `/api/cron/reset-quota` is not scheduled there and is dead code — it operates on a `usage_quotas` table that doesn't exist in the schema (quota is computed live from `usage_logs`, see below), so calling it will error.

### Identity & quota model (`src/utils/usage.ts`)

This is the core gate in front of every generation. Four tiers: `guest | free | pro | guru`.

- `getIdentity()` — if a Supabase-authenticated user exists, reads their `profiles.tier`/`tier_expires_at` (auto-downgrades to `free` server-side if expired). Otherwise falls back to a `guest_id` httpOnly cookie minted by `src/middleware.ts` for every request.
- `getDynamicTierLimits()` — loads per-tier limits from the `pricing_tiers` table (admin-editable via `/api/admin/pricing`), falling back to the hardcoded `TIER_LIMITS` if the DB is empty/unreachable. Two independent caps per tier: `maxPerPeriod` (soal/day) and `maxSoal` (soal per single generation request).
- `checkQuota()` / `logUsage()` — daily usage is derived by summing `usage_logs.questions_count` for the current calendar day (server local time), keyed by `user_id` or `guest_token`. There is no separate counter column to increment — quota is always recomputed from the log table.
- `/api/generate` enforces both caps before calling Anthropic, builds the Indonesian prompt (distinct format per question type, including a `campuran`/mixed mode via a `mixedConfig` count map), then logs usage and returns the updated remaining quota so the client can adjust its UI without a second round trip.
- `profiles` also carries `name`/`phone`/`email` columns beyond the base `supabase_migration.sql` (populated at signup, see Auth section) — `/api/usage` and `/api/admin/users` read these.

### Payments (Midtrans) — one live flow, one orphaned flow, don't confuse them

There are **two independent checkout implementations** in the codebase; only one is actually reachable from the UI:

- **Live flow**: `src/components/LembarGuruApp.tsx`'s in-app `UpgradeModal` → `POST /api/payment/create-transaction` → response `{ redirect_url, order_id }` → browser does `window.location.href = redirect_url` (Midtrans-hosted checkout page, not an embedded popup). `create-transaction/route.ts` builds its **own inline** `midtransClient.Snap` instance and its **own inline** promo-validation/discount logic (does not use `src/utils/promo.ts` or `src/utils/pricing.ts`), inserts the order (`tier`, `period`, `amount`, `status: 'pending'`, `discount_amount`, `promo_code_id`), and increments promo usage via `admin.rpc('increment_promo_used_count', ...)` **at checkout creation time, before payment is confirmed**.
- **Orphaned flow**: `src/app/checkout/page.tsx` (route `/checkout?plan=&cycle=`) is not linked to from anywhere else in the app — it's only reachable by typing the URL directly. It expects the create-transaction response to contain a Snap `token` for `window.snap.pay(data.token, ...)` (embedded popup flow), but the current `create-transaction/route.ts` returns `redirect_url`/`order_id` instead — **this page is broken against the current API and should not be treated as the reference checkout flow.** Likewise `src/utils/midtrans.ts` (a shared `snap` client export) is unused dead code — nothing imports it.
- `src/app/api/payment/webhook/route.ts` verifies the Midtrans signature (`sha512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)`), maps `transaction_status`/`fraud_status` to `orders.status` (`success|failed|pending`), guards against duplicate notifications via `order.status` already being final, and on success updates `profiles.tier`/`tier_expires_at` and sends a Resend email (separate templates for success and failure — `successEmailTemplate`/`failedEmailTemplate` inline in the file).
- Pricing and discounts are configured in the admin web (`pricing_tiers`, `promo_codes` tables), not in Midtrans — Midtrans only receives the final computed `gross_amount`/`price`.

### ⚠️ Promo code validation is broken in the live checkout path

Three separate implementations of "validate a promo code" exist, and the one actually wired to the live UI is broken:

- `src/utils/pricing.ts` → `validatePromoCode()` — unused by any route currently.
- `src/utils/promo.ts` → `validatePromoInternal()` — used correctly by `/api/promos/validate` (POST), but that route is only called from the **orphaned** `/checkout` page above.
- `src/app/api/public/promos/validate/route.ts` — this is the endpoint the **live** `UpgradeModal` in `LembarGuruApp.tsx` calls (`POST /api/public/promos/validate` with `{ code }`). Its file only exports a `GET` handler (it's effectively a duplicate of `/api/public/promos` — lists all currently-valid promos, ignores any submitted code). A `POST` to it will get a 405, so **applying a promo code in the main app's upgrade modal currently always fails.** Fix would be adding a `POST` handler there that calls `validatePromoInternal` (mirroring `/api/promos/validate`).
- `create-transaction/route.ts` re-validates the promo a fourth time inline (its own copy of the logic) when actually charging — this one path is correct and is what determines the real charged amount, so a broken client-side "validate" call doesn't let anyone bypass pricing, it just means users can't preview/apply a discount before paying.

### ⚠️ `/api/admin/promos` has no authorization check

Unlike its siblings (`/api/admin/pricing`, `/api/admin/users` both call `requireAdmin()`), `src/app/api/admin/promos/route.ts`'s `GET`/`POST`/`PATCH`/`DELETE` handlers call `requireAdmin` **nowhere** — any unauthenticated request can create, disable, or delete promo codes via the service-role client. Check this before doing any other work in that file.

### `orders`/`promo_codes` schema — migration exists but doesn't match current code

`profiles` (`tier`/`tier_expires_at`) and `usage_logs` from `src/docs/supabase_migration.sql` are the source of truth for tier and quota. Base `orders` only has `tier`, `period`, `amount`, `status` (`pending|success|failed`), `paid_at`. `src/utils/supabase/migrations/0003_orders_promo_fields.sql` adds `promo_id`, `base_amount`, `discount_amount`, `promo_code` — but the **current** `create-transaction/route.ts` inserts into `discount_amount` and **`promo_code_id`** (not `promo_id`), so that migration as written won't fully unblock the insert. Reconcile the column name (either rename the migration's column to `promo_code_id`, or update the route) before running it against Supabase.

An even older, now-removed convention (`profiles.plan`/`plan_active_until`, a `usage_quotas` table, `orders.plan_tier`/`cycle`, `status: 'paid'`) has already been cleaned out of `webhook.ts`/`create-transaction.ts`. If you see those names reappear, that's the old broken convention creeping back in — don't copy it.

### Auth & admin

- Supabase SSR auth via three client constructors: `src/utils/supabase/client.ts` (browser), `server.ts` (route handlers/server components, cookie-based), `admin.ts` (service-role key, bypasses RLS — only use in trusted server code, never expose to the client).
- `src/middleware.ts` runs on nearly every request (excludes static assets): refreshes the Supabase session and ensures a `guest_id` cookie exists.
- **Two independent sign-up entry points** exist: `src/app/login/page.tsx` (toggles login/register inline, collects name + optional WhatsApp phone, upserts them into `profiles` directly from the browser client) and `src/app/register/page.tsx` (dedicated page, captures a `?ref=` referral code into `localStorage` and redeems it via `/api/referral/redeem` after signup). Only the `/register` path wires up referral capture — signing up via `/login`'s inline register mode does not.
- Admin authorization is a single check: the logged-in user's email must equal `process.env.ADMIN_EMAIL` (`src/utils/admin.ts:requireAdmin()`; duplicated inline in `/api/admin/check` and `/api/admin/stats` instead of reusing it). There is no role table. `/api/admin/promos` is missing this check entirely (see above).
- `/admin` (`src/app/admin/page.tsx`) is a client-rendered dashboard hitting `/api/admin/stats`, `/api/admin/pricing`, `/api/admin/promos`, `/api/admin/users` — it also lets an admin set a custom `tier_expires_at` date per user (defaults to +30 days if left blank).

### Referrals

`src/lib/referral.ts` + tables from `src/utils/supabase/migrations/0002_referral.sql`: a `referrals` row per referrer (`code` unique) and a `referral_redemptions` row per redemption (unique on `referred_user_id`, so one redemption per account, inserted by `/api/referral/redeem`). `src/components/ReferralBanner.tsx` renders the shareable `/register?ref=CODE` link. `markReferralSuccess()` (marks a redemption as rewarded) is defined but **not called anywhere** — the current `webhook.ts` doesn't reference it, so referral rewards are never actually granted even when the referred user pays.

### Question generation & export

- `src/app/api/generate/route.ts` builds tightly-specified Indonesian prompts per question type (`Pilihan Ganda`, `Esai / Uraian`, `Benar atau Salah`, `Isian Singkat`, `HOTS (Pro)`, or `campuran` mixing several) and asks the model to avoid markdown so the raw text can be parsed reliably. `max_tokens` is computed dynamically from question count/type.
- The client (`src/components/LembarGuruApp.tsx:parseQuestions`) parses that plain-text response back into structured `Question` objects, used for on-screen rendering and re-sent to `/api/export-docx` to build the Word document via the `docx` library.
- DOCX export is gated to `pro`/`guru` tiers server-side (checked again in `/api/export-docx`, don't rely on client-side gating alone).
- `src/app/coba-gratis/page.tsx` is a **separate, standalone** guest-trial generator UI (its own form + its own calls to `/api/generate`/`/api/usage`) — it does **not** reuse `LembarGuruApp`. Only `src/app/page.tsx` renders `LembarGuruApp`.

### Frontend structure

- `src/components/LembarGuruApp.tsx` is the large (1700+ line) primary generation UI (used only from `src/app/page.tsx`) — generator form, results view, quota/usage display, the upgrade modal (see Payments), promo/share modal, and a static "Alat Bantu Guru" tool grid that links to `/tools/{slug}` routes that don't exist yet (placeholder navigation only, will 404).
- `src/app/page.tsx` is the marketing landing page (pricing cards fetched live from `/api/pricing` with a hardcoded `defaultPlans` fallback, FAQ, feature list) plus the actual app entry point.
- Styling mixes Tailwind v4 with plain CSS files (`globals.css`, `page.css`) and inline style objects; `LembarGuruApp.tsx` defines its own inline `THEMES` (light/dark) object rather than relying purely on CSS variables.
