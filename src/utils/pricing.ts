import { createAdminClient } from '@/utils/supabase/admin'

export type TierKey = 'pro' | 'guru'

export async function getActivePricing() {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('pricing_tiers')
    .select('tier, label, price_monthly, price_yearly, active, max_soal, max_gen_per_day, unlimited_gen')
    .eq('active', true)
  if (error) throw error
  return data ?? []
}

export async function getTierPrice(tier: TierKey, period: 'monthly' | 'yearly') {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('pricing_tiers')
    .select('price_monthly, price_yearly, active')
    .eq('tier', tier)
    .single()
  if (error || !data || !data.active) return null
  return period === 'monthly' ? data.price_monthly : data.price_yearly
}

type PromoValidationResult =
  | { valid: true; discount_type: 'percent' | 'fixed'; discount_value: number; promo_id: string }
  | { valid: false; reason: string }

export async function validatePromoCode(code: string, tier: TierKey): Promise<PromoValidationResult> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from('promo_codes')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .eq('active', true)
    .single()

  if (error || !data) return { valid: false, reason: 'Kode promo tidak ditemukan.' }

  const now = new Date()
  if (data.valid_until && new Date(data.valid_until) < now)
    return { valid: false, reason: 'Kode promo sudah kedaluwarsa.' }
  if (data.max_uses !== null && data.used_count >= data.max_uses)
    return { valid: false, reason: 'Kuota kode promo sudah habis.' }
  if (data.applies_to !== 'all' && data.applies_to !== tier)
    return { valid: false, reason: `Kode promo ini tidak berlaku untuk tier ${tier}.` }

  return {
    valid: true,
    discount_type: data.discount_type as 'percent' | 'fixed',
    discount_value: data.discount_value as number,
    promo_id: data.id as string,
  }
}

export function applyDiscount(price: number, discountType: 'percent' | 'fixed', discountValue: number) {
  if (discountType === 'percent') return Math.max(0, Math.round(price * (1 - discountValue / 100)))
  return Math.max(0, price - discountValue)
}

export async function incrementPromoUsage(promoId: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('promo_codes').select('used_count').eq('id', promoId).single()
  await admin.from('promo_codes').update({ used_count: (data?.used_count ?? 0) + 1 }).eq('id', promoId)
}
