import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export type TierType = 'guest' | 'free' | 'pro' | 'guru'

type TierLimit = {
  maxPerPeriod: number | null  // max soal per hari (null = unlimited)
  maxSoal: number              // max soal per sesi
  periodType: 'daily' | 'none'
}

// Fallback statis jika DB tidak tersedia
export const TIER_LIMITS: Record<TierType, TierLimit> = {
  guest: { maxPerPeriod: 10,   maxSoal: 5,  periodType: 'daily' },
  free:  { maxPerPeriod: 20,   maxSoal: 10, periodType: 'daily' },
  pro:   { maxPerPeriod: null, maxSoal: 20, periodType: 'none'  },
  guru:  { maxPerPeriod: null, maxSoal: 50, periodType: 'none'  },
}

// Load tier limits dari DB (pricing_tiers), fallback ke TIER_LIMITS
export async function getDynamicTierLimits(): Promise<Record<TierType, TierLimit>> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pricing_tiers')
      .select('tier, max_gen_per_day, max_soal, unlimited_gen')

    if (error) {
      console.error('[getDynamicTierLimits] DB error:', error.message)
      return TIER_LIMITS
    }

    if (!data || data.length === 0) {
      console.warn('[getDynamicTierLimits] pricing_tiers kosong, pakai fallback statis')
      return TIER_LIMITS
    }

    const result = { ...TIER_LIMITS }
    for (const row of data) {
      const key = row.tier as TierType
      if (!(key in TIER_LIMITS)) continue
      result[key] = {
        maxPerPeriod: row.unlimited_gen ? null : (row.max_gen_per_day ?? TIER_LIMITS[key].maxPerPeriod),
        maxSoal: row.max_soal ?? TIER_LIMITS[key].maxSoal,
        periodType: row.unlimited_gen ? 'none' : 'daily',
      }
    }

    return result
  } catch (e) {
    console.error('[getDynamicTierLimits] exception:', e)
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

// Hitung total soal yang sudah digenerate hari ini
export async function checkQuota(identity: { type: TierType; identifier: string }) {
  const limits = await getDynamicTierLimits()
  const limit = limits[identity.type]

  if (limit.maxPerPeriod === null) {
    return { allowed: true, used: 0, max: null as number | null }
  }

  const admin = createAdminClient()
  const column = identity.type === 'guest' ? 'guest_token' : 'user_id'

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { data, error } = await admin
    .from('usage_logs')
    .select('questions_count')
    .eq(column, identity.identifier)
    .eq('status', 'success')
    .gte('created_at', startOfDay.toISOString())

  if (error) throw error

  const used = (data ?? []).reduce((sum, row) => sum + (row.questions_count ?? 1), 0)
  return { allowed: used < limit.maxPerPeriod, used, max: limit.maxPerPeriod }
}

export async function logUsage(
  identity: { type: TierType; identifier: string },
  options: {
    action?: string
    tokensUsed?: number
    questionsCount?: number
    status?: 'success' | 'error'
  } = {}
) {
  const admin = createAdminClient()
  const column = identity.type === 'guest' ? 'guest_token' : 'user_id'

  await admin.from('usage_logs').insert({
    [column]: identity.identifier,
    action: options.action ?? 'generate',
    tokens_used: options.tokensUsed ?? 0,
    questions_count: options.questionsCount ?? 1,
    status: options.status ?? 'success',
  })
}
