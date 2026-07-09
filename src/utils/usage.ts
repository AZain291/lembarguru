import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getClientIpHash } from '@/utils/ip'

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

// Daftar slug tool ("Alat Bantu Guru") yang boleh diakses tier tersebut
// (kolom enabled_tools, migration 0010) -- null berarti semua tool
// diizinkan (default, dan juga fallback kalau migration belum jalan/DB
// error). Dipakai /api/usage supaya client (LembarGuruApp.tsx) tahu tool
// mana yang harus di-nonaktifkan/di-abu-abukan di toolbar.
export async function getEnabledTools(tier: TierType): Promise<string[] | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('pricing_tiers')
      .select('enabled_tools')
      .eq('tier', tier)
      .maybeSingle()

    if (error || !data) return null
    return Array.isArray(data.enabled_tools) ? data.enabled_tools : null
  } catch {
    return null
  }
}

export async function getIdentity() {
  const ipHash = await getClientIpHash()
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

    return { type: tier, identifier: user.id, email: user.email ?? null, tierExpiresAt: tier === 'free' ? null : (profile?.tier_expires_at ?? null), ipHash }
  }

  const cookieStore = await cookies()
  const guestId = cookieStore.get('guest_id')?.value
  if (!guestId) throw new Error('Guest ID tidak ditemukan')

  return { type: 'guest' as TierType, identifier: guestId, email: null, tierExpiresAt: null, ipHash }
}

// Hitung total soal yang sudah digenerate hari ini. Untuk tamu, dihitung
// dari baris yang cocok guest_token ATAU ip_hash -- guest_id cookie
// trivial di-reset (clear cookie/incognito), tapi jaringan (IP) yang sama
// tetap kena kuota gabungan supaya tidak bisa generate berulang cuma
// dengan buka tab baru/incognito (lihat src/utils/ip.ts, migration 0009).
export async function checkQuota(identity: { type: TierType; identifier: string; ipHash?: string | null }) {
  const limits = await getDynamicTierLimits()
  const limit = limits[identity.type]

  if (limit.maxPerPeriod === null) {
    return { allowed: true, used: 0, max: null as number | null }
  }

  const admin = createAdminClient()

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  let query = admin
    .from('usage_logs')
    .select('questions_count')
    .eq('status', 'success')
    .gte('created_at', startOfDay.toISOString())

  if (identity.type === 'guest') {
    query = identity.ipHash
      ? query.or(`guest_token.eq.${identity.identifier},ip_hash.eq.${identity.ipHash}`)
      : query.eq('guest_token', identity.identifier)
  } else {
    query = query.eq('user_id', identity.identifier)
  }

  const { data, error } = await query

  if (error) throw error

  const used = (data ?? []).reduce((sum, row) => sum + (row.questions_count ?? 1), 0)
  return { allowed: used < limit.maxPerPeriod, used, max: limit.maxPerPeriod }
}

export async function logUsage(
  identity: { type: TierType; identifier: string; ipHash?: string | null },
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
    ip_hash: identity.ipHash ?? null,
    action: options.action ?? 'generate',
    tokens_used: options.tokensUsed ?? 0,
    questions_count: options.questionsCount ?? 1,
    status: options.status ?? 'success',
  })
}
