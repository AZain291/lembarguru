// src/types/lembarguru.ts — v2
// Disamakan dengan skema ASLI (dari src/utils/pricing.ts, src/utils/promo.ts,
// src/app/api/admin/pricing/route.ts yang kamu kirim). v1 kemarin pakai nama
// kolom karangan sendiri (nama, harga_bulanan, dst) — dibuang.

// Tier yang benar-benar ada: 'guest' (kuota tamu), 'free', 'pro', 'guru'.
// BELUM DIKONFIRMASI: apakah 'guru' = "Guru Pro" di mockup, atau = "Sekolah"?
// pricing.ts kamu cuma punya TierKey = 'pro' | 'guru' (dua tier berbayar),
// sementara mockup landing page ada 3 kartu (Gratis/Pro/Sekolah). Cek kolom
// `label` di tabel pricing_tiers untuk pastikan sebelum pakai di UI publik.
export type Tier = 'guest' | 'free' | 'pro' | 'guru';

export interface PricingTier {
  tier: Tier;
  label: string;
  price_monthly: number;
  price_yearly: number;
  active: boolean;
  max_soal: number;
  max_gen_per_day: number | null;
  unlimited_gen: boolean;
}

export type DiscountType = 'percent' | 'fixed';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  applies_to: string;       // 'all' atau daftar tier dipisah koma, mis. "pro,guru"
  max_uses: number | null;
  used_count: number;
  valid_until: string | null;
  active: boolean;
  created_at: string;
}

// ===== REFERRAL — tabel baru, belum ada di project, penamaan kolom
// disamakan dengan konvensi promo_codes (Inggris, snake_case) =====

export type ReferralStatus = 'pending' | 'success' | 'cancelled';

export interface Referral {
  id: string;
  referrer_user_id: string;
  code: string;              // kode unik milik referrer, mis. "AZ-7X2K"
  created_at: string;
}

export interface ReferralRedemption {
  id: string;
  referral_id: string;
  referred_user_id: string;
  status: ReferralStatus;
  // reward baru diberikan setelah referred_user_id subscribe paket
  // berbayar pertama kali — logikanya perlu ditambahkan di
  // src/app/api/payment/webhook/route.ts (belum saya sentuh, kamu belum kirim isinya)
  reward_given: boolean;
  reward_amount: number | null;
  created_at: string;
  updated_at: string;
}
