// Dipakai bersama oleh:
// - src/app/api/promos/validate/route.ts (validasi saat user mengetik kode)
// - src/app/api/payment/create-transaction/route.ts (validasi ulang saat bayar,
//   supaya tidak bisa dicurangi lewat manipulasi request)
//
// ASUMSI kolom promo_codes (dari route public promos yang kamu kirim):
// id, code, discount_type, discount_value, applies_to, valid_until,
// max_uses, used_count, active

export type PromoValidation =
  | { valid: true; id: string; discountType: 'percentage' | 'fixed'; discountValue: number }
  | { valid: false; error: string }

export async function validatePromoInternal(
  admin: any,
  code: string,
  tier: string
): Promise<PromoValidation> {
  const { data, error } = await admin
    .from('promo_codes')
    .select('id, code, discount_type, discount_value, applies_to, valid_until, max_uses, used_count, active')
    .ilike('code', code)
    .maybeSingle()

  if (error) {
    console.error('[promo] gagal query promo_codes:', error)
    return { valid: false, error: 'Gagal memeriksa kode promo' }
  }
  if (!data) {
    return { valid: false, error: 'Kode promo tidak ditemukan' }
  }
  if (data.active === false) {
    return { valid: false, error: 'Kode promo tidak aktif' }
  }
  if (data.valid_until && new Date(data.valid_until) < new Date()) {
    return { valid: false, error: 'Kode promo sudah kedaluwarsa' }
  }
  if (data.max_uses && (data.used_count ?? 0) >= data.max_uses) {
    return { valid: false, error: 'Kode promo sudah mencapai batas penggunaan' }
  }
  if (data.applies_to && data.applies_to !== 'all') {
    const allowedTiers = String(data.applies_to)
      .split(',')
      .map((t: string) => t.trim())
    if (!allowedTiers.includes(tier)) {
      return { valid: false, error: 'Kode promo tidak berlaku untuk paket ini' }
    }
  }

  return {
    valid: true,
    id: data.id,
    discountType: data.discount_type,
    discountValue: Number(data.discount_value),
  }
}
