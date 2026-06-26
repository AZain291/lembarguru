import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type TierType = 'guest' | 'free' | 'pro' | 'guru'

type TierLimit = {
  maxPerPeriod: number | null
  maxSoal: number
  periodType: 'lifetime' | 'daily' | 'none'
}

// Fallback statis jika DB tidak tersedia
export const TIER_LIMITS: Record<TierType, TierLimit> = {
  guest: { maxPerPeriod: 3,    maxSoal: 5,  periodType: 'lifetime' },
  free:  { maxPerPeriod: 5,    maxSoal: 10, periodType: 'daily' },
  pro:   { maxPerPeriod: null, maxSoal: 20, periodType: 'none' },
  guru:  { maxPerPeriod: null, maxSoal: 50, periodType: 'none' },
}

// Load tier limits dari DB (pricing_tiers), fallback ke TIER_LIMITS
export async function getDynamicTierLimits(): Promise<Record<TierType, TierLimit>> {
  try {
    const admin = createAdminClient()
    const { data } = await admin.from('pricing_tiers').select('tier, max_gen_per_day, max_soal, unlimited_gen')
    if (!data || data.length === 0) return TIER_LIMITS

    const result = { ...TIER_LIMITS }
    for (const row of data) {
      const key = row.tier as TierType
      if (key === 'guest') continue
      result[key] = {
        maxPerPeriod: row.unlimited_gen ? null : (row.max_gen_per_day ?? TIER_LIMITS[key].maxPerPeriod),
        maxSoal: row.max_soal ?? TIER_LIMITS[key].maxSoal,
        periodType: row.unlimited_gen ? 'none' : (key === 'free' ? 'daily' : 'none'),
      }
    }
    return result
  } catch {
    return TIER_LIMITS
  }
}

export async function getIdentity() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier, tier_expires_at')
      .eq('id', user.id)
      .single()

    let tier = (profile?.tier ?? 'free') as TierType
    const expired = profile?.tier_expires_at && new Date(profile.tier_expires_at) < new Date()

    if (tier !== 'free' && expired) {
      tier = 'free'
      const admin = createAdminClient()
      await admin.from('profiles').update({ tier: 'free', tier_expires_at: null }).eq('id', user.id)
    }

    return { type: tier, identifier: user.id, email: user.email ?? null }
  }

  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_id')?.value
  if (!guestId) throw new Error('Guest ID tidak ditemukan')

  return { type: 'guest' as TierType, identifier: guestId, email: null }
}

export async function checkQuota(identity: { type: TierType; identifier: string }) {
  const limits = await getDynamicTierLimits()
  const limit = limits[identity.type]

  if (limit.maxPerPeriod === null) {
    return { allowed: true, used: 0, max: null as number | null }
  }

  const admin = createAdminClient()
  const column = identity.type === 'guest' ? 'guest_token' : 'user_id'

  let query = admin
    .from('usage_logs')
    .select('id', { count: 'exact', head: true })
    .eq(column, identity.identifier)
    .eq('status', 'success')

  if (limit.periodType === 'daily') {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    query = query.gte('created_at', startOfDay.toISOString())
  }

  const { count, error } = await query
  if (error) throw error

  const used = count ?? 0
  return { allowed: used < limit.maxPerPeriod, used, max: limit.maxPerPeriod }
}

export async function logUsage(
  identity: { type: TierType; identifier: string },
  options: { action?: string; tokensUsed?: number; status?: 'success' | 'error' } = {}
) {
  const admin = createAdminClient()
  const column = identity.type === 'guest' ? 'guest_token' : 'user_id'

  await admin.from('usage_logs').insert({
    [column]: identity.identifier,
    action: options.action ?? 'generate',
    tokens_used: options.tokensUsed ?? 0,
    status: options.status ?? 'success',
  })
}
